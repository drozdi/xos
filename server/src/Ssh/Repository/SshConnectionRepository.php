<?php

namespace Ssh\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Ssh\Entity\SshConnection;
use Ssh\Entity\SshKey;

/**
 * @extends ServiceEntityRepository<SshConnection>
 */
class SshConnectionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SshConnection::class);
    }

    /**
     * @return list<SshConnection>
     */
    public function findForUser(User $user): array
    {
        /** @var list<SshConnection> $rows */
        $rows = $this->createQueryBuilder('c')
            ->andWhere('c.user = :user')
            ->setParameter('user', $user)
            ->orderBy('c.name', 'ASC')
            ->addOrderBy('c.id', 'ASC')
            ->getQuery()
            ->getResult();

        return $rows;
    }

    public function findOneForUser(User $user, int $id): ?SshConnection
    {
        $row = $this->findOneBy(['user' => $user, 'id' => $id]);

        return $row instanceof SshConnection ? $row : null;
    }

    public function countUsingKey(SshKey $key): int
    {
        return (int) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->andWhere('c.key = :key')
            ->setParameter('key', $key)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
