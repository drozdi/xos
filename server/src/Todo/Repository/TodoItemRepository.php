<?php

namespace Todo\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Todo\Entity\TodoItem;

/**
 * @extends ServiceEntityRepository<TodoItem>
 */
class TodoItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TodoItem::class);
    }

    /** @return list<TodoItem> */
    public function findDueInRange(User $user, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        return $this->createQueryBuilder('i')
            ->innerJoin('i.list', 'l')
            ->leftJoin('l.shares', 's')
            ->andWhere('l.owner = :user OR s.user = :user')
            ->andWhere('i.dueAt IS NOT NULL')
            ->andWhere('i.dueAt >= :start AND i.dueAt <= :end')
            ->setParameter('user', $user)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('i.dueAt', 'ASC')
            ->addOrderBy('i.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
