<?php

namespace Samba\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Samba\Entity\SambaServer;
use Samba\Entity\SambaServerAccess;

/**
 * @extends ServiceEntityRepository<SambaServer>
 */
class SambaServerRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SambaServer::class);
    }

    /**
     * @return list<SambaServer>
     */
    public function findVisible(User $user): array
    {
        /** @var list<SambaServer> $rows */
        $rows = $this->createQueryBuilder('s')
            ->distinct()
            ->leftJoin(SambaServerAccess::class, 'a', 'WITH', 'a.server = s AND a.user = :user')
            ->andWhere('s.owner = :user OR a.id IS NOT NULL')
            ->setParameter('user', $user)
            ->orderBy('s.name', 'ASC')
            ->addOrderBy('s.id', 'ASC')
            ->getQuery()
            ->getResult();

        return $rows;
    }

    public function findVisibleOne(User $user, int $id): ?SambaServer
    {
        $server = $this->find($id);

        return $server instanceof SambaServer && $this->isVisible($user, $server) ? $server : null;
    }

    public function isVisible(User $user, SambaServer $server): bool
    {
        if ($this->same($user, $server->getOwner())) {
            return true;
        }

        return null !== $this->getEntityManager()->getRepository(SambaServerAccess::class)
            ->findOneBy(['server' => $server, 'user' => $user]);
    }

    public function countOwned(User $user): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->andWhere('s.owner = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    private function same(User $left, User $right): bool
    {
        if ($left === $right) {
            return true;
        }

        return null !== $left->getId() && $left->getId() === $right->getId();
    }
}
