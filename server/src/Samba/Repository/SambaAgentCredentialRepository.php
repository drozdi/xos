<?php

namespace Samba\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Samba\Entity\SambaAgentCredential;
use Samba\Entity\SambaServer;

/**
 * @extends ServiceEntityRepository<SambaAgentCredential>
 */
class SambaAgentCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SambaAgentCredential::class);
    }

    /**
     * @return list<SambaAgentCredential>
     */
    public function findActiveByLookup(string $lookup): array
    {
        /** @var list<SambaAgentCredential> $rows */
        $rows = $this->createQueryBuilder('c')
            ->andWhere('c.lookup = :lookup')
            ->andWhere('c.revokedAt IS NULL')
            ->setParameter('lookup', $lookup)
            ->getQuery()
            ->getResult();

        return $rows;
    }

    public function findActiveForServer(SambaServer $server): ?SambaAgentCredential
    {
        $row = $this->createQueryBuilder('c')
            ->andWhere('c.server = :server')
            ->andWhere('c.revokedAt IS NULL')
            ->setParameter('server', $server)
            ->orderBy('c.id', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();

        return $row instanceof SambaAgentCredential ? $row : null;
    }
}
