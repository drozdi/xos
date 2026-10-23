<?php

namespace Todo\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Todo\Entity\TodoList;

/**
 * @extends ServiceEntityRepository<TodoList>
 */
class TodoListRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TodoList::class);
    }

    /** @return list<TodoList> */
    public function findAccessibleForUser(User $user): array
    {
        return $this->createQueryBuilder('l')
            ->leftJoin('l.shares', 's')
            ->andWhere('l.owner = :user OR s.user = :user')
            ->setParameter('user', $user)
            ->orderBy('l.xTimestamp', 'DESC')
            ->addOrderBy('l.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /** @return list<TodoList> */
    public function findDueInRange(User $user, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        return $this->createQueryBuilder('l')
            ->leftJoin('l.shares', 's')
            ->andWhere('l.owner = :user OR s.user = :user')
            ->andWhere('l.dueAt IS NOT NULL')
            ->andWhere('l.dueAt >= :start AND l.dueAt <= :end')
            ->setParameter('user', $user)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('l.dueAt', 'ASC')
            ->addOrderBy('l.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
