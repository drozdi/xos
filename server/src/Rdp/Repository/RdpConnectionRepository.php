<?php

namespace Rdp\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Rdp\Entity\RdpConnection;

/**
 * @extends ServiceEntityRepository<RdpConnection>
 */
class RdpConnectionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RdpConnection::class);
    }

    /**
     * @return list<RdpConnection>
     */
    public function findForUser(User $user): array
    {
        /** @var list<RdpConnection> $rows */
        $rows = $this->createQueryBuilder('c')
            ->andWhere('c.user = :user')
            ->setParameter('user', $user)
            ->orderBy('c.name', 'ASC')
            ->addOrderBy('c.id', 'ASC')
            ->getQuery()
            ->getResult();

        return $rows;
    }

    public function findOneForUser(User $user, int $id): ?RdpConnection
    {
        $row = $this->findOneBy(['user' => $user, 'id' => $id]);

        return $row instanceof RdpConnection ? $row : null;
    }
}
