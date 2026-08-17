<?php

namespace Board\Repository;

use Board\Entity\Board;
use Board\Entity\Workspace;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Board>
 */
class BoardRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Board::class);
    }

    /** @return list<Board> */
    public function findByWorkspace(Workspace $workspace): array
    {
        return $this->createQueryBuilder('b')
            ->andWhere('b.workspace = :workspace')
            ->setParameter('workspace', $workspace)
            ->orderBy('b.updatedAt', 'DESC')
            ->addOrderBy('b.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
