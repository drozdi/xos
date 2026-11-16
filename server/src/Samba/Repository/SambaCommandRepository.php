<?php

namespace Samba\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\DBAL\LockMode;
use Doctrine\Persistence\ManagerRegistry;
use Samba\Entity\SambaCommand;
use Samba\Entity\SambaServer;

/**
 * @extends ServiceEntityRepository<SambaCommand>
 */
class SambaCommandRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SambaCommand::class);
    }

    public function findOldestQueued(SambaServer $server): ?SambaCommand
    {
        $query = $this->createQueryBuilder('c')
            ->andWhere('c.server = :server')
            ->andWhere('c.status = :status')
            ->setParameter('server', $server)
            ->setParameter('status', 'queued')
            ->orderBy('c.id', 'ASC')
            ->setMaxResults(1)
            ->getQuery();
        $query->setLockMode(LockMode::PESSIMISTIC_WRITE);
        $row = $query->getOneOrNullResult();

        return $row instanceof SambaCommand ? $row : null;
    }
}
