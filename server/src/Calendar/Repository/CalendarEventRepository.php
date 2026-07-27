<?php

namespace Calendar\Repository;

use Calendar\Entity\CalendarEvent;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<CalendarEvent>
 */
class CalendarEventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CalendarEvent::class);
    }

    /**
     * @param list<int>|null $calendarIds
     *
     * @return list<CalendarEvent>
     */
    public function findInRange(
        User $user,
        \DateTimeInterface $start,
        \DateTimeInterface $end,
        ?array $calendarIds = null,
    ): array {
        $qb = $this->createQueryBuilder('e')
            ->innerJoin('e.calendar', 'c')
            ->leftJoin('c.shares', 's')
            ->leftJoin('c.groupShares', 'gs')
            ->leftJoin('gs.group', 'g')
            ->leftJoin('g.users', 'ug')
            ->andWhere('c.owner = :user OR s.user = :user OR ug.user = :user')
            ->andWhere('e.startAt < :end AND e.endAt > :start')
            ->setParameter('user', $user)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('e.startAt', 'ASC')
            ->addOrderBy('e.id', 'ASC');

        if (null !== $calendarIds && [] !== $calendarIds) {
            $qb->andWhere('c.id IN (:calendarIds)')
                ->setParameter('calendarIds', $calendarIds);
        }

        return $qb->getQuery()->getResult();
    }
}
