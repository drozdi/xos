<?php

namespace Board\Repository;

use Board\Entity\Board;
use Board\Entity\Label;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Label>
 */
class LabelRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Label::class);
    }

    /** @return list<Label> */
    public function findByBoard(Board $board): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.board = :board')
            ->setParameter('board', $board)
            ->orderBy('l.name', 'ASC')
            ->addOrderBy('l.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
