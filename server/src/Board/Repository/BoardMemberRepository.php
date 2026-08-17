<?php

namespace Board\Repository;

use Board\Entity\Board;
use Board\Entity\BoardMember;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<BoardMember>
 */
class BoardMemberRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BoardMember::class);
    }

    public function findOneByBoardAndUser(Board $board, User $user): ?BoardMember
    {
        return $this->findOneBy([
            'board' => $board,
            'user' => $user,
        ]);
    }
}
