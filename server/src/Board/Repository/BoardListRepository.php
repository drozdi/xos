<?php

namespace Board\Repository;

use Board\Entity\Board;
use Board\Entity\BoardList;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BoardList>
 */
class BoardListRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BoardList::class);
    }

    /** @return list<BoardList> */
    public function findByBoardOrdered(Board $board): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.board = :board')
            ->setParameter('board', $board)
            ->orderBy('l.orderIndex', 'ASC')
            ->addOrderBy('l.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getMaxOrderIndex(Board $board): ?int
    {
        $result = $this->createQueryBuilder('l')
            ->select('MAX(l.orderIndex)')
            ->andWhere('l.board = :board')
            ->setParameter('board', $board)
            ->getQuery()
            ->getSingleScalarResult();

        return null !== $result ? (int) $result : null;
    }
}
