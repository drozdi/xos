<?php

namespace Board\Repository;

use Board\Entity\ActivityLog;
use Board\Entity\Board;
use Board\Entity\Card;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ActivityLog>
 */
class ActivityLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ActivityLog::class);
    }

    /** @return list<ActivityLog> */
    public function findByBoardOrdered(Board $board, int $limit = 50, int $offset = 0): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.board = :board')
            ->setParameter('board', $board)
            ->orderBy('a.createdAt', 'DESC')
            ->addOrderBy('a.id', 'DESC')
            ->setFirstResult(max(0, $offset))
            ->setMaxResults(max(1, $limit))
            ->getQuery()
            ->getResult();
    }

    /** @return list<ActivityLog> */
    public function findByCardOrdered(Card $card, int $limit = 50): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.card = :card')
            ->setParameter('card', $card)
            ->orderBy('a.createdAt', 'DESC')
            ->addOrderBy('a.id', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
