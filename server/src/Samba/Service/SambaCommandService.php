<?php

namespace Samba\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Samba\Entity\SambaAgentCredential;
use Samba\Entity\SambaCommand;
use Samba\Entity\SambaServer;
use Samba\Repository\SambaAgentCredentialRepository;
use Samba\Repository\SambaCommandRepository;
use Samba\Repository\SambaServerAccessRepository;
use Samba\Repository\SambaServerRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;

final class SambaCommandService
{
    /** @var list<string> */
    private const READ = ['directory.read', 'object.read', 'conf.read'];

    /** @var list<string> */
    private const WRITE = [
        'ou.ensure',
        'ou.delete',
        'user.ensure',
        'user.disable',
        'user.enable',
        'user.delete',
        'user.set_password',
        'group.ensure',
        'group.delete',
        'group.members',
        'object.write',
        'object.move',
        'conf.write',
        'smb.template',
    ];

    /** @var list<string> */
    private const WRITABLE = [
        'givenName',
        'sn',
        'displayName',
        'description',
        'mail',
        'telephoneNumber',
        'title',
        'department',
        'company',
        'physicalDeliveryOfficeName',
        'homeDirectory',
        'homeDrive',
        'scriptPath',
        'profilePath',
    ];

    public function __construct(
        private readonly SambaServerRepository $servers,
        private readonly SambaServerAccessRepository $accesses,
        private readonly SambaCommandRepository $commands,
        private readonly SambaAgentCredentialRepository $credentials,
        private readonly EntityManagerInterface $entityManager,
        private readonly AgentLink $agentLink,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{id: int, status: string}
     */
    public function enqueue(User $actor, int $serverId, array $data): array
    {
        $command = $this->stage($actor, $serverId, $data);
        $this->agentLink->nudge($command);

        return ['id' => (int) $command->getId(), 'status' => $command->getStatus()];
    }

    /**
     * @param array<string, mixed> $data
     */
    public function stage(User $actor, int $serverId, array $data): SambaCommand
    {
        $server = $this->visible($actor, $serverId);
        $type = (string) ($data['type'] ?? '');
        if (in_array($type, self::READ, true)) {
            if ('conf.read' === $type) {
                $this->assertRight($actor, $server, SambaRights::MANAGE);
            } else {
                $allowed = $this->hasRight($actor, $server, SambaRights::DIRECTORY) || $this->hasRight($actor, $server, SambaRights::MANAGE);
                if ('directory.read' === $type && $this->hasRight($actor, $server, SambaRights::SHARES)) {
                    $allowed = true;
                }
                if (!$allowed) {
                    throw new AccessDeniedHttpException('Недостаточно прав');
                }
            }
        } elseif (in_array($type, ['shares.read', 'shares.apply', 'share.remove', 'shares.homes'], true)) {
            $this->assertRight($actor, $server, SambaRights::SHARES);
        } elseif (in_array($type, self::WRITE, true)) {
            $this->assertRight($actor, $server, SambaRights::MANAGE);
        } else {
            throw new BadRequestHttpException('Операция не из белого списка');
        }
        $args = is_array($data['args'] ?? null) ? $data['args'] : [];
        $password = $this->password($type, $args);
        unset($args['password']);
        $args = $this->arguments($type, $args);
        $sealed = null;
        if (null !== $password) {
            $sealed = $this->seal($server, $password);
        }
        $label = (string) ($actor->getAlias() ?: $actor->getLogin() ?: '#'.$actor->getId());
        $command = new SambaCommand($server, $actor, mb_substr($label, 0, 255), $type, $args, $sealed);
        $this->entityManager->persist($command);
        $this->entityManager->flush();

        return $command;
    }

    /**
     * @return array{synced_at: string|null, tree: array<string, mixed>}
     */
    public function directory(User $actor, int $serverId): array
    {
        $server = $this->visible($actor, $serverId);
        $allowed = $this->hasRight($actor, $server, SambaRights::DIRECTORY) || $this->hasRight($actor, $server, SambaRights::MANAGE);
        if (!$allowed) {
            throw new AccessDeniedHttpException('Недостаточно прав');
        }
        $tree = $server->getDirectorySnapshot() ?? ['ous' => [], 'users' => [], 'groups' => []];

        return [
            'synced_at' => $server->getDirectorySyncedAt()?->format(\DateTimeInterface::ATOM),
            'tree' => $tree,
        ];
    }

    /**
     * @return array{id: int, type: string, status: string, result: string|null, created_at: string}
     */
    public function get(User $actor, int $serverId, int $commandId): array
    {
        $server = $this->visible($actor, $serverId);
        $command = $this->commands->find($commandId);
        if (!$command instanceof SambaCommand || $command->getServer()->getId() !== $server->getId() || !$this->canRead($actor, $command)) {
            throw new NotFoundHttpException('Команда не найдена');
        }

        return [
            'id' => (int) $command->getId(),
            'type' => $command->getType(),
            'status' => $command->getStatus(),
            'result' => $command->getResult(),
            'created_at' => $command->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }

    public function managed(User $actor, int $id): SambaServer
    {
        $server = $this->visible($actor, $id);
        $this->assertRight($actor, $server, SambaRights::MANAGE);

        return $server;
    }

    private function visible(User $actor, int $id): SambaServer
    {
        $server = $this->servers->findVisibleOne($actor, $id);
        if (!$server instanceof SambaServer) {
            throw new NotFoundHttpException('Сервер не найден');
        }

        return $server;
    }

    private function assertRight(User $actor, SambaServer $server, int $bit): void
    {
        if (!$this->hasRight($actor, $server, $bit)) {
            throw new AccessDeniedHttpException('Недостаточно прав');
        }
    }

    private function hasRight(User $actor, SambaServer $server, int $bit): bool
    {
        if (SambaGuard::isOwner($actor, $server)) {
            return true;
        }
        $access = $this->accesses->findOneFor($server, $actor);

        return null !== $access && SambaRights::has($access->getRights(), $bit);
    }

    private function canRead(User $actor, SambaCommand $command): bool
    {
        if (SambaGuard::isOwner($actor, $command->getServer())) {
            return true;
        }
        $author = $command->getAuthor();

        return $author instanceof User && null !== $author->getId() && $author->getId() === $actor->getId();
    }

    /**
     * @param array<string, mixed> $args
     */
    private function password(string $type, array $args): ?string
    {
        $needs = 'user.set_password' === $type || 'user.ensure' === $type;
        $password = isset($args['password']) ? (string) $args['password'] : '';
        if (!$needs) {
            return null;
        }
        if (strlen($password) < 8 || strlen($password) > 128 || 1 === preg_match('/[\x00-\x1F]/', $password)) {
            throw new BadRequestHttpException('Пароль заполнен неверно');
        }

        return $password;
    }

    /**
     * @param array<string, mixed> $args
     *
     * @return array<string, mixed>
     */
    private function arguments(string $type, array $args): array
    {
        if ('directory.read' === $type || 'shares.read' === $type || 'smb.template' === $type) {
            return [];
        }
        if ('shares.homes' === $type) {
            return ['enabled' => true === ($args['enabled'] ?? false)];
        }
        if ('conf.read' === $type || 'conf.write' === $type) {
            $file = (string) ($args['file'] ?? '');
            if (!in_array($file, ['smb', 'shares'], true)) {
                throw new BadRequestHttpException('Файл не из списка');
            }
            if ('conf.read' === $type) {
                return ['file' => $file];
            }
            $content = (string) ($args['content'] ?? '');
            if (strlen($content) > 1_000_000) {
                throw new BadRequestHttpException('Текст конфига заполнен неверно');
            }

            return ['file' => $file, 'content' => $content];
        }
        if ('shares.apply' === $type) {
            return $this->shareArguments($args);
        }
        if ('share.remove' === $type) {
            return ['name' => $this->label($args['name'] ?? null, true)];
        }
        if ('object.read' === $type || 'object.move' === $type || 'object.write' === $type) {
            return $this->objectArguments($type, $args);
        }
        $name = $this->label($args['name'] ?? null, true);
        if ('group.members' === $type) {
            $action = (string) ($args['action'] ?? '');
            if (!in_array($action, ['add', 'remove'], true)) {
                throw new BadRequestHttpException('Действие заполнено неверно');
            }

            return [
                'name' => $name,
                'member' => $this->label($args['member'] ?? null, true),
                'action' => $action,
            ];
        }
        $payload = ['name' => $name];
        if ('ou.ensure' === $type) {
            $parent = $this->label($args['parent'] ?? null, false);
            if (null !== $parent) {
                $payload['parent'] = $parent;
            }
        }
        if ('user.ensure' === $type) {
            foreach (['given_name', 'surname', 'ou'] as $key) {
                $value = $this->label($args[$key] ?? null, false);
                if (null !== $value) {
                    $payload[$key] = $value;
                }
            }
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $args
     *
     * @return array<string, mixed>
     */
    private function objectArguments(string $type, array $args): array
    {
        $kind = (string) ($args['kind'] ?? '');
        if (!in_array($kind, ['user', 'group', 'ou'], true)) {
            throw new BadRequestHttpException('Тип записи заполнен неверно');
        }
        $name = $this->label($args['name'] ?? null, true);
        if ('object.read' === $type) {
            return ['kind' => $kind, 'name' => $name];
        }
        if ('object.move' === $type) {
            $parent = $this->longLabel($args['parent'] ?? null, true);
            if (null === $parent) {
                throw new BadRequestHttpException('Подразделение не указано');
            }

            return ['kind' => $kind, 'name' => $name, 'parent' => $parent];
        }
        $source = is_array($args['attributes'] ?? null) ? $args['attributes'] : [];
        $attributes = [];
        foreach (self::WRITABLE as $key) {
            if (!array_key_exists($key, $source)) {
                continue;
            }
            $value = str_replace("\r\n", "\n", (string) $source[$key]);
            if (strlen($value) > 512 || 1 === preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $value)) {
                throw new BadRequestHttpException('Значение заполнено неверно');
            }
            $attributes[$key] = $value;
        }
        if ([] === $attributes) {
            throw new BadRequestHttpException('Нет полей для записи');
        }

        return ['kind' => $kind, 'name' => $name, 'attributes' => $attributes];
    }

    /**
     * @param array<string, mixed> $args
     *
     * @return array<string, mixed>
     */
    private function shareArguments(array $args): array
    {
        $name = $this->label($args['name'] ?? null, true);
        if (1 === preg_match('/[\[\]#="]/u', $name) || 0 === strcasecmp($name, 'homes')) {
            throw new BadRequestHttpException('Имя шары заполнено неверно');
        }
        $path = trim((string) ($args['path'] ?? ''));
        if (!str_starts_with($path, '/') || str_contains($path, '..') || strlen($path) > 255 || 1 === preg_match('/[\x00-\x1F]/', $path)) {
            throw new BadRequestHttpException('Путь шары заполнен неверно');
        }
        $comment = trim((string) ($args['comment'] ?? ''));
        if (strlen($comment) > 200 || 1 === preg_match('/[\x00-\x1F"]/', $comment)) {
            throw new BadRequestHttpException('Комментарий заполнен неверно');
        }
        $source = is_array($args['acl'] ?? null) ? $args['acl'] : [];
        if (count($source) > 50) {
            throw new BadRequestHttpException('Слишком много прав');
        }
        $acl = [];
        foreach ($source as $row) {
            if (!is_array($row)) {
                throw new BadRequestHttpException('Права заполнены неверно');
            }
            $kind = (string) ($row['kind'] ?? '');
            $access = (string) ($row['access'] ?? '');
            if (!in_array($kind, ['user', 'group'], true) || !in_array($access, ['read', 'write', 'admin'], true)) {
                throw new BadRequestHttpException('Права заполнены неверно');
            }
            $acl[] = [
                'kind' => $kind,
                'name' => $this->label($row['name'] ?? null, true),
                'access' => $access,
            ];
        }

        return [
            'name' => $name,
            'path' => $path,
            'comment' => $comment,
            'guest' => true === ($args['guest'] ?? false),
            'enabled' => false !== ($args['enabled'] ?? true),
            'recycle' => true === ($args['recycle'] ?? false),
            'recursive' => true === ($args['recursive'] ?? false),
            'acl' => $acl,
        ];
    }

    private function longLabel(mixed $value, bool $required): ?string
    {
        $text = trim((string) $value);
        if ('' === $text) {
            if ($required) {
                throw new BadRequestHttpException('Имя не указано');
            }

            return null;
        }
        if (mb_strlen($text) > 512 || str_starts_with($text, '-') || 1 === preg_match('/[\x00-\x1F]/u', $text)) {
            throw new BadRequestHttpException('Имя заполнено неверно');
        }

        return $text;
    }

    private function label(mixed $value, bool $required): ?string
    {
        $text = trim((string) $value);
        if ('' === $text) {
            if ($required) {
                throw new BadRequestHttpException('Имя не указано');
            }

            return null;
        }
        if (mb_strlen($text) > 64 || str_starts_with($text, '-') || 1 === preg_match('/[\x00-\x1F]/u', $text)) {
            throw new BadRequestHttpException('Имя заполнено неверно');
        }

        return $text;
    }

    private function seal(SambaServer $server, string $password): string
    {
        if (!function_exists('sodium_crypto_box_seal')) {
            throw new ServiceUnavailableHttpException(null, 'Расширение sodium не установлено');
        }
        $credential = $this->credentials->findActiveForServer($server);
        $encoded = $credential instanceof SambaAgentCredential ? $credential->getSealPublicKey() : null;
        $public = is_string($encoded) ? base64_decode($encoded, true) : false;
        if (!is_string($public) || SODIUM_CRYPTO_BOX_PUBLICKEYBYTES !== strlen($public)) {
            throw new ServiceUnavailableHttpException(null, 'Агент ещё не зарегистрирован');
        }

        return base64_encode(sodium_crypto_box_seal($password, $public));
    }
}
