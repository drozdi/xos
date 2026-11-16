<?php

namespace Rdp\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Rdp\Entity\RdpNetwork;

/**
 * @extends ServiceEntityRepository<RdpNetwork>
 */
class RdpNetworkRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RdpNetwork::class);
    }

    /**
     * @return list<RdpNetwork>
     */
    public function findActive(): array
    {
        /** @var list<RdpNetwork> $rows */
        $rows = $this->createQueryBuilder('n')
            ->andWhere('n.active = true')
            ->orderBy('n.name', 'ASC')
            ->getQuery()
            ->getResult();

        return $rows;
    }

    /**
     * @return list<RdpNetwork>
     */
    public function findGranted(User $user): array
    {
        if ($user->hasRole('ROLE_ROOT') || $user->hasRole('ROLE_RDP_ROOT')) {
            return $this->findActive();
        }
        $groupIds = [];
        foreach ($user->getGroups() as $link) {
            $group = $link->getGroup();
            if (null !== $group && null !== $group->getId()) {
                $groupIds[] = $group->getId();
            }
        }
        $roles = array_values(array_filter($user->getRoles(), static fn (string $role): bool => '' !== $role));
        if ([] === $groupIds && [] === $roles) {
            return [];
        }
        $builder = $this->createQueryBuilder('n')
            ->distinct()
            ->innerJoin('n.grants', 'g')
            ->andWhere('n.active = true');
        $or = $builder->expr()->orX();
        if ([] !== $roles) {
            $or->add('g.role IN (:roles)');
            $builder->setParameter('roles', $roles);
        }
        if ([] !== $groupIds) {
            $or->add('g.group IN (:groups)');
            $builder->setParameter('groups', $groupIds);
        }
        /** @var list<RdpNetwork> $rows */
        $rows = $builder->andWhere($or)->orderBy('n.name', 'ASC')->getQuery()->getResult();

        return $rows;
    }
}
