<?php

namespace Calendar\Repository;

use Calendar\Entity\Calendar;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<Calendar>
 */
class CalendarRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Calendar::class);
    }

    /** @return list<Calendar> */
    public function findAccessibleForUser(User $user): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.shares', 's')
            ->andWhere('c.owner = :user OR s.user = :user')
            ->setParameter('user', $user)
            ->orderBy('c.xTimestamp', 'DESC')
            ->addOrderBy('c.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
