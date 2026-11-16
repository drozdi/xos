<?php

namespace Rdp\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\Group;
use Main\Entity\User;
use Main\Repository\GroupRepository;
use Main\Service\AuditLogger;
use Rdp\Entity\RdpNetwork;
use Rdp\Entity\RdpNetworkGrant;
use Rdp\Repository\RdpNetworkRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class RdpNetworkManager
{
    public function __construct(
        private readonly RdpNetworkRepository $networks,
        private readonly GroupRepository $groups,
        private readonly EntityManagerInterface $entityManager,
        private readonly AuditLogger $audit,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listAll(): array
    {
        return array_map($this->serialize(...), $this->networks->findBy([], ['name' => 'ASC']));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listGranted(User $user): array
    {
        return array_map(fn (RdpNetwork $network): array => [
            'id' => $network->getId(),
            'name' => $network->getName(),
            'cidrs' => $network->getCidrs(),
        ], $this->networks->findGranted($user));
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function create(User $user, array $data): array
    {
        $network = new RdpNetwork();
        $network->setCreatedBy($user);
        $this->apply($network, $data);
        $this->entityManager->persist($network);
        $this->entityManager->flush();
        $this->audit->log('rdp.network.create', 'rdp_network', $network->getId(), $network->getName(), [
            'cidrs' => $network->getCidrs(),
        ], $user);

        return $this->serialize($network);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public function update(User $user, int $id, array $data): array
    {
        $network = $this->require($id);
        $this->apply($network, $data);
        $this->entityManager->flush();
        $this->audit->log('rdp.network.update', 'rdp_network', $network->getId(), $network->getName(), [
            'cidrs' => $network->getCidrs(),
        ], $user);

        return $this->serialize($network);
    }

    public function delete(User $user, int $id): void
    {
        $network = $this->require($id);
        $name = $network->getName();
        $this->entityManager->remove($network);
        $this->entityManager->flush();
        $this->audit->log('rdp.network.delete', 'rdp_network', $id, $name, null, $user);
    }

    /**
     * @param list<array<string, mixed>> $grants
     *
     * @return array<string, mixed>
     */
    public function replaceGrants(User $user, int $id, array $grants): array
    {
        $network = $this->require($id);
        foreach ($network->getGrants()->toArray() as $grant) {
            $network->getGrants()->removeElement($grant);
            $this->entityManager->remove($grant);
        }
        foreach ($grants as $row) {
            if (!is_array($row)) {
                throw new BadRequestHttpException('Выдача заполнена неверно');
            }
            $grant = new RdpNetworkGrant($network);
            $groupId = $row['group_id'] ?? null;
            $role = $row['role'] ?? null;
            $hasGroup = null !== $groupId && '' !== $groupId;
            $hasRole = is_string($role) && '' !== trim($role);
            if ($hasGroup === $hasRole) {
                throw new BadRequestHttpException('Укажите группу или роль');
            }
            if ($hasGroup) {
                if (!is_int($groupId) && !(is_string($groupId) && ctype_digit($groupId))) {
                    throw new BadRequestHttpException('Группа заполнена неверно');
                }
                $group = $this->groups->find((int) $groupId);
                if (!$group instanceof Group) {
                    throw new BadRequestHttpException('Группа не найдена');
                }
                $grant->setGroup($group);
            } else {
                $role = strtoupper(trim((string) $role));
                if (!str_starts_with($role, 'ROLE_')) {
                    $role = 'ROLE_'.$role;
                }
                if (1 !== preg_match('/^ROLE_[A-Z0-9_]{1,48}$/', $role)) {
                    throw new BadRequestHttpException('Роль заполнена неверно');
                }
                $grant->setRole($role);
            }
            $network->getGrants()->add($grant);
            $this->entityManager->persist($grant);
        }
        $this->entityManager->flush();
        $this->audit->log('rdp.network.grants', 'rdp_network', $network->getId(), $network->getName(), [
            'grants' => count($grants),
        ], $user);

        return $this->serialize($network);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function apply(RdpNetwork $network, array $data): void
    {
        $name = trim((string) ($data['name'] ?? ''));
        if ('' === $name || strlen($name) > 120) {
            throw new BadRequestHttpException('Название заполнено неверно');
        }
        $raw = $data['cidrs'] ?? null;
        if (!is_array($raw) || [] === $raw) {
            throw new BadRequestHttpException('Укажите сети');
        }
        $cidrs = [];
        foreach ($raw as $cidr) {
            $cidrs[] = CidrMatcher::assertCidr((string) $cidr);
        }
        $suffixes = [];
        foreach (is_array($data['dns_suffixes'] ?? null) ? $data['dns_suffixes'] : [] as $suffix) {
            $suffix = strtolower(trim((string) $suffix));
            if ('' === $suffix) {
                continue;
            }
            if (1 !== preg_match('/^[a-z0-9.-]{1,120}$/', $suffix)) {
                throw new BadRequestHttpException('Суффикс DNS заполнен неверно');
            }
            $suffixes[] = $suffix;
        }
        $network
            ->setName($name)
            ->setCidrs(array_values(array_unique($cidrs)))
            ->setDnsSuffixes($suffixes)
            ->setDescription(isset($data['description']) ? trim((string) $data['description']) : $network->getDescription())
            ->setActive(!array_key_exists('active', $data) || true === $data['active'] || '1' === $data['active'])
            ->setAllowClipboard(!array_key_exists('allow_clipboard', $data) || true === $data['allow_clipboard'])
            ->setAllowDrive(true === ($data['allow_drive'] ?? false));
    }

    private function require(int $id): RdpNetwork
    {
        $network = $this->networks->find($id);

        return $network instanceof RdpNetwork ? $network : throw new NotFoundHttpException('Сеть не найдена');
    }

    /**
     * @return array<string, mixed>
     */
    private function serialize(RdpNetwork $network): array
    {
        $grants = [];
        foreach ($network->getGrants() as $grant) {
            $grants[] = [
                'id' => $grant->getId(),
                'group_id' => $grant->getGroup()?->getId(),
                'group_name' => $grant->getGroup()?->getName(),
                'role' => $grant->getRole(),
            ];
        }

        return [
            'id' => $network->getId(),
            'name' => $network->getName(),
            'cidrs' => $network->getCidrs(),
            'dns_suffixes' => $network->getDnsSuffixes(),
            'active' => $network->isActive(),
            'description' => $network->getDescription(),
            'allow_clipboard' => $network->allowsClipboard(),
            'allow_drive' => $network->allowsDrive(),
            'node_id' => $network->getNode()?->getId(),
            'grants' => $grants,
        ];
    }
}
