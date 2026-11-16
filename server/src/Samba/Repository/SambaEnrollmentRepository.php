<?php

namespace Samba\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Samba\Entity\SambaEnrollment;

/**
 * @extends ServiceEntityRepository<SambaEnrollment>
 */
class SambaEnrollmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SambaEnrollment::class);
    }

    /**
     * @return list<SambaEnrollment>
     */
    public function findPendingByLookup(string $lookup): array
    {
        /** @var list<SambaEnrollment> $rows */
        $rows = $this->createQueryBuilder('e')
            ->andWhere('e.lookup = :lookup')
            ->andWhere('e.usedAt IS NULL')
            ->andWhere('e.expiresAt > :now')
            ->setParameter('lookup', $lookup)
            ->setParameter('now', new \DateTime())
            ->getQuery()
            ->getResult();

        return $rows;
    }
}
