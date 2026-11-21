<?php

namespace Samba\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\Group;
use Main\Entity\OU;
use Main\Entity\User;
use Main\Entity\User\Group as Membership;
use Main\Repository\GroupRepository;
use Main\Repository\OURepository;
use Main\Repository\UserRepository;
use Samba\Entity\SambaCommand;
use Samba\Entity\SambaServer;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

/** Переносит пользователей и группы подразделения main в домен. */
final class SambaImportService
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly GroupRepository $groups,
        private readonly OURepository $ous,
        private readonly SambaCommandService $commands,
        private readonly AgentLink $agentLink,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{user: array<string, string>, group: array<string, string>}
     */
    public function map(User $actor, int $serverId): array
    {
        $server = $this->server($actor, $serverId);

        return $this->stored($server);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{user: array<string, string>, group: array<string, string>}
     */
    public function saveMap(User $actor, int $serverId, array $data): array
    {
        $server = $this->server($actor, $serverId);
        $map = SambaImportMap::normalize($data);
        $server->setImportMap($map);
        $this->entityManager->flush();

        return $map;
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{queued: int, skipped: list<string>}
     */
    public function run(User $actor, int $serverId, array $data): array
    {
        $server = $this->server($actor, $serverId);
        $snapshot = $server->getDirectorySnapshot();
        if (!is_array($snapshot) || !$server->getDirectorySyncedAt() instanceof \DateTimeInterface) {
            throw new BadRequestHttpException('Сначала обновите каталог');
        }
        $ouIds = $this->ids($data['ou_ids'] ?? null);
        $userIds = $this->ids($data['user_ids'] ?? null);
        $groupIds = $this->ids($data['group_ids'] ?? null);
        if ([] === $ouIds && [] === $userIds && [] === $groupIds) {
            throw new BadRequestHttpException('Не выбраны записи');
        }
        $map = $this->stored($server);
        $knownUsers = $this->names($snapshot['users'] ?? null);
        $knownGroups = $this->names($snapshot['groups'] ?? null);
        $ouDns = $this->ouDns($snapshot['ous'] ?? null);
        $containers = $this->containers($snapshot['ous'] ?? null);
        $domain = $containers['domain'];
        $usersDn = $containers['users'];
        $memberNames = $this->memberNames($snapshot['groups'] ?? null, $snapshot['users'] ?? null);
        $skipped = [];
        $staged = [];
        $importedUsers = [];
        $importedGroups = [];
        $importedOus = [];
        $allowedOus = array_fill_keys($ouIds, true);

        foreach ([] === $ouIds ? [] : $this->ous->findBy(['id' => $ouIds]) as $ou) {
            if (!$ou instanceof OU) {
                continue;
            }
            $name = $this->account((string) $ou->getCode());
            if (null === $name) {
                $skipped[] = 'Подразделение «'.$ou->getCode().'» пропущено: код не годится как имя';
                continue;
            }
            $importedOus[strtolower($name)] = $name;
            $fresh = !isset($ouDns[strtolower($name)]);
            if ($fresh) {
                $created = $this->put($actor, $serverId, ['type' => 'ou.ensure', 'args' => ['name' => $name]], $skipped, $name);
                if ($created instanceof SambaCommand) {
                    $staged[] = $created;
                }
            }
            $attributes = [];
            $title = trim((string) $ou->getName());
            $description = trim((string) $ou->getDescription());
            if ('' !== $title && mb_strlen($title) <= 512) {
                $attributes['displayName'] = $title;
            }
            if ('' !== $description && mb_strlen($description) <= 512) {
                $attributes['description'] = $description;
            }
            if ([] !== $attributes) {
                $command = $this->put($actor, $serverId, [
                    'type' => 'object.write',
                    'args' => ['kind' => 'ou', 'name' => $name, 'attributes' => $attributes],
                ], $skipped, $name);
                if ($command instanceof SambaCommand) {
                    $staged[] = $command;
                }
            }
        }

        foreach ([] === $groupIds ? [] : $this->groups->findBy(['id' => $groupIds]) as $group) {
            if (!$group instanceof Group) {
                continue;
            }
            if (!$this->held($group->getOu(), $allowedOus)) {
                $skipped[] = 'Группа «'.$group->getCode().'» пропущена: подразделение не переносится';
                continue;
            }
            $name = $this->account((string) $group->getCode());
            if (null === $name) {
                $skipped[] = 'Группа «'.$group->getCode().'» пропущена: код не годится как имя';
                continue;
            }
            $importedGroups[$group->getId()] = $name;
            $fresh = !isset($knownGroups[strtolower($name)]);
            if ($fresh) {
                $created = $this->put($actor, $serverId, ['type' => 'group.ensure', 'args' => ['name' => $name]], $skipped, $name);
                if ($created instanceof SambaCommand) {
                    $staged[] = $created;
                    $home = $this->home($group->getOu(), $importedOus, $ouDns, $domain, $usersDn);
                    $staged = array_merge($staged, $this->place($actor, $serverId, 'group', $name, $home, $skipped));
                }
            }
            $attributes = $this->attributes($map['group'], fn (string $field): string => $this->groupValue($group, $field));
            if ([] !== $attributes) {
                $command = $this->put($actor, $serverId, [
                    'type' => 'object.write',
                    'args' => ['kind' => 'group', 'name' => $name, 'attributes' => $attributes],
                ], $skipped, $name);
                if ($command instanceof SambaCommand) {
                    $staged[] = $command;
                }
            }
        }

        foreach ([] === $userIds ? [] : $this->users->findBy(['id' => $userIds]) as $user) {
            if (!$user instanceof User) {
                continue;
            }
            if (!$this->held($user->getOu(), $allowedOus)) {
                $skipped[] = 'Пользователь «'.$user->getLogin().'» пропущен: подразделение не переносится';
                continue;
            }
            $name = $this->account((string) $user->getLogin());
            if (null === $name) {
                $skipped[] = 'Пользователь «'.$user->getLogin().'» пропущен: логин не годится как имя';
                continue;
            }
            $importedUsers[strtolower($name)] = $user;
            $fresh = !isset($knownUsers[strtolower($name)]);
            if ($fresh && strlen($name) < 8) {
                $skipped[] = 'Пользователь «'.$name.'» пропущен: пароль равен логину и короче 8 символов';
                unset($importedUsers[strtolower($name)]);
                continue;
            }
            if ($fresh) {
                $args = ['name' => $name, 'password' => $name];
                $given = $this->mapped($map['user'], 'givenName', $user);
                $surname = $this->mapped($map['user'], 'sn', $user);
                if ('' !== $given) {
                    $args['given_name'] = $given;
                }
                if ('' !== $surname) {
                    $args['surname'] = $surname;
                }
                $home = $this->home($user->getOu(), $importedOus, $ouDns, $domain, $usersDn);
                if ('' === $home) {
                    $ouCode = $this->account((string) $user->getOu()?->getCode());
                    $ouName = null === $ouCode ? '' : ($importedOus[strtolower($ouCode)] ?? '');
                    if ('' !== $ouName) {
                        $args['ou'] = $ouName;
                    }
                }
                $created = $this->put($actor, $serverId, ['type' => 'user.ensure', 'args' => $args], $skipped, $name);
                if ($created instanceof SambaCommand) {
                    $staged[] = $created;
                    $staged = array_merge($staged, $this->place($actor, $serverId, 'user', $name, $home, $skipped));
                }
            }
            $attributes = $this->attributes($map['user'], fn (string $field): string => $this->userValue($user, $field));
            if ([] !== $attributes) {
                $command = $this->put($actor, $serverId, [
                    'type' => 'object.write',
                    'args' => ['kind' => 'user', 'name' => $name, 'attributes' => $attributes],
                ], $skipped, $name);
                if ($command instanceof SambaCommand) {
                    $staged[] = $command;
                }
            }
        }

        foreach ($importedGroups as $groupId => $groupName) {
            $group = $this->groups->find($groupId);
            if (!$group instanceof Group) {
                continue;
            }
            $already = $memberNames[strtolower($groupName)] ?? [];
            foreach ($group->getUsers() as $link) {
                if (!$link instanceof Membership) {
                    continue;
                }
                $login = strtolower($this->account((string) $link->getUserLogin()) ?? '');
                if ('' === $login || !isset($importedUsers[$login]) || isset($already[$login])) {
                    continue;
                }
                $command = $this->put($actor, $serverId, [
                    'type' => 'group.members',
                    'args' => ['name' => $groupName, 'member' => $importedUsers[$login]->getLogin(), 'action' => 'add'],
                ], $skipped, $groupName);
                if ($command instanceof SambaCommand) {
                    $staged[] = $command;
                    $already[$login] = true;
                }
            }
        }

        $this->mark($this->users, $this->kept($this->users, $userIds, $allowedOus), $this->kept($this->users, $this->ids($data['seen_user_ids'] ?? null), $allowedOus));
        $this->mark($this->groups, $this->kept($this->groups, $groupIds, $allowedOus), $this->kept($this->groups, $this->ids($data['seen_group_ids'] ?? null), $allowedOus));
        $this->mark($this->ous, $ouIds, $this->ids($data['seen_ou_ids'] ?? null));

        if ([] !== $staged) {
            $this->agentLink->nudge($staged[0]);
        }

        return ['queued' => count($staged), 'skipped' => $skipped];
    }

    /**
     * @return array{user: array<string, string>, group: array<string, string>}
     */
    private function stored(SambaServer $server): array
    {
        $raw = $server->getImportMap();

        return is_array($raw) ? SambaImportMap::normalize($raw) : SambaImportMap::defaults();
    }

    private function server(User $actor, int $serverId): SambaServer
    {
        return $this->commands->managed($actor, $serverId);
    }

    /**
     * @param list<string> $skipped
     */
    /**
     * @param list<string> $skipped
     *
     * @return list<SambaCommand>
     */
    private function place(User $actor, int $serverId, string $kind, string $name, string $sambaOu, array &$skipped): array
    {
        if ('' === $sambaOu) {
            return [];
        }
        $command = $this->put($actor, $serverId, [
            'type' => 'object.move',
            'args' => ['kind' => $kind, 'name' => $name, 'parent' => $sambaOu],
        ], $skipped, $name);

        return $command instanceof SambaCommand ? [$command] : [];
    }

    /**
     * @param list<string> $skipped
     */
    private function put(User $actor, int $serverId, array $data, array &$skipped, string $name): ?SambaCommand
    {
        try {
            return $this->commands->stage($actor, $serverId, $data);
        } catch (HttpExceptionInterface $error) {
            $skipped[] = $name.': '.$error->getMessage();

            return null;
        }
    }

    /**
     * @param array<string, string>    $map
     * @param callable(string): string $value
     *
     * @return array<string, string>
     */
    private function attributes(array $map, callable $value): array
    {
        $attributes = [];
        foreach ($map as $attribute => $field) {
            $text = trim($value($field));
            if ('' === $text || mb_strlen($text) > 512) {
                continue;
            }
            $attributes[$attribute] = $text;
        }

        return $attributes;
    }

    private function mapped(array $map, string $attribute, User $user): string
    {
        $field = $map[$attribute] ?? '';

        return '' === $field ? '' : trim($this->userValue($user, $field));
    }

    private function userValue(User $user, string $field): string
    {
        return match ($field) {
            'login' => (string) $user->getLogin(),
            'first_name' => (string) $user->getFirstName(),
            'second_name' => (string) $user->getSecondName(),
            'patronymic' => (string) $user->getPatronymic(),
            'alias' => (string) $user->getAlias(),
            'email' => (string) $user->getEmail(),
            'phone' => (string) $user->getPhone(),
            'description' => (string) $user->getDescription(),
            default => '',
        };
    }

    private function groupValue(Group $group, string $field): string
    {
        return match ($field) {
            'code' => (string) $group->getCode(),
            'name' => (string) $group->getName(),
            'description' => (string) $group->getDescription(),
            default => '',
        };
    }

    /**
     * @return list<int>
     */
    private function ids(mixed $raw): array
    {
        if (!is_array($raw)) {
            return [];
        }
        $ids = [];
        foreach ($raw as $item) {
            $id = (int) $item;
            if ($id > 0) {
                $ids[$id] = $id;
            }
        }
        if (count($ids) > 2000) {
            throw new BadRequestHttpException('Слишком много записей');
        }

        return array_values($ids);
    }

    /**
     * @param array<int, true> $allowed
     */
    private function held(?OU $ou, array $allowed): bool
    {
        $id = $ou?->getId();

        return is_int($id) && isset($allowed[$id]);
    }

    /**
     * @param list<int>        $ids
     * @param array<int, true> $allowed
     *
     * @return list<int>
     */
    private function kept(object $repository, array $ids, array $allowed): array
    {
        if ([] === $ids || !method_exists($repository, 'findBy')) {
            return [];
        }
        $kept = [];
        foreach ($repository->findBy(['id' => $ids]) as $entity) {
            if (!is_object($entity) || !method_exists($entity, 'getOu') || !method_exists($entity, 'getId')) {
                continue;
            }
            $ou = $entity->getOu();
            if ($ou instanceof OU && $this->held($ou, $allowed)) {
                $kept[] = (int) $entity->getId();
            }
        }

        return $kept;
    }

    /**
     * @param list<int> $chosen
     * @param list<int> $seen
     */
    private function mark(object $repository, array $chosen, array $seen): void
    {
        $ids = array_values(array_unique([...$chosen, ...$seen]));
        if ([] === $ids || !method_exists($repository, 'findBy')) {
            return;
        }
        $on = array_fill_keys($chosen, true);
        foreach ($repository->findBy(['id' => $ids]) as $entity) {
            if (!is_object($entity) || !method_exists($entity, 'setDomain') || !method_exists($entity, 'getId')) {
                continue;
            }
            $entity->setDomain(isset($on[(int) $entity->getId()]));
        }
        $this->entityManager->flush();
    }

    /**
     * @param array<string, string> $imported
     * @param array<string, string> $dns
     */
    private function home(?OU $ou, array $imported, array $dns, string $domain, string $fallback): string
    {
        if ($ou instanceof OU) {
            $code = $this->account((string) $ou->getCode());
            $key = null === $code ? '' : strtolower($code);
            if ('' !== $key && isset($imported[$key])) {
                if (isset($dns[$key])) {
                    return $dns[$key];
                }
                if ('' !== $domain) {
                    return 'OU='.$this->dnRdn($code).','.$domain;
                }

                return '';
            }
        }

        return $fallback;
    }

    /**
     * @return array{domain: string, users: string}
     */
    private function containers(mixed $rows): array
    {
        $domain = '';
        $users = '';
        if (is_array($rows)) {
            foreach ($rows as $row) {
                if (!is_array($row)) {
                    continue;
                }
                $dn = trim((string) ($row['dn'] ?? ''));
                $name = strtolower(trim((string) ($row['name'] ?? '')));
                if ('' === $domain && 1 === preg_match('/(?:^|,)(DC=.+)$/i', $dn, $match)) {
                    $domain = $match[1];
                }
                if ('users' === $name && ('' === $users || str_starts_with(strtolower($dn), 'cn=users,'))) {
                    $users = $dn;
                }
            }
        }
        if ('' === $users && '' !== $domain) {
            $users = 'CN=Users,'.$domain;
        }

        return ['domain' => $domain, 'users' => $users];
    }

    private function dnRdn(string $name): string
    {
        return str_replace(
            ['\\', ',', '+', '"', '<', '>', ';', '='],
            ['\\\\', '\\,', '\\+', '\\"', '\\<', '\\>', '\\;', '\\='],
            $name,
        );
    }

    /**
     * @return array<string, string>
     */
    private function ouDns(mixed $rows): array
    {
        $map = [];
        if (!is_array($rows)) {
            return $map;
        }
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $name = strtolower(trim((string) ($row['name'] ?? '')));
            $dn = trim((string) ($row['dn'] ?? ''));
            if ('' !== $name && '' !== $dn) {
                $map[$name] = $dn;
            }
        }

        return $map;
    }

    private function account(string $value): ?string
    {
        $text = trim($value);
        if ('' === $text || str_starts_with($text, '-') || mb_strlen($text) > 64 || 1 === preg_match('/[\x00-\x1F]/u', $text)) {
            return null;
        }

        return $text;
    }

    /**
     * @return array<string, true>
     */
    private function names(mixed $rows): array
    {
        $names = [];
        if (!is_array($rows)) {
            return $names;
        }
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $name = strtolower(trim((string) ($row['name'] ?? '')));
            if ('' !== $name) {
                $names[$name] = true;
            }
        }

        return $names;
    }

    /**
     * @return array<string, array<string, true>>
     */
    private function memberNames(mixed $groups, mixed $users): array
    {
        $byDn = [];
        if (is_array($users)) {
            foreach ($users as $user) {
                if (!is_array($user)) {
                    continue;
                }
                $name = strtolower(trim((string) ($user['name'] ?? '')));
                $dn = strtolower(trim((string) ($user['dn'] ?? '')));
                if ('' !== $name && '' !== $dn) {
                    $byDn[$dn] = $name;
                }
            }
        }
        $result = [];
        if (!is_array($groups)) {
            return $result;
        }
        foreach ($groups as $group) {
            if (!is_array($group)) {
                continue;
            }
            $groupName = strtolower(trim((string) ($group['name'] ?? '')));
            if ('' === $groupName) {
                continue;
            }
            $members = [];
            foreach (is_array($group['members'] ?? null) ? $group['members'] : [] as $member) {
                $text = trim((string) $member);
                $key = strtolower($text);
                if (isset($byDn[$key])) {
                    $members[$byDn[$key]] = true;
                }
                if (1 === preg_match('/^cn=([^,]+)/i', $text, $match)) {
                    $members[strtolower($match[1])] = true;
                }
            }
            $result[$groupName] = $members;
        }

        return $result;
    }
}
