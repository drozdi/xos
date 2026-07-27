<?php

namespace Calendar\Repository;

use Calendar\Entity\CalendarGroupShare;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CalendarGroupShare>
 */
class CalendarGroupShareRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CalendarGroupShare::class);
    }
}
