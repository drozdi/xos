<?php

namespace Board\Repository;

use Board\Entity\Card;
use Board\Entity\Comment;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Comment>
 */
class CommentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Comment::class);
    }

    /** @return list<Comment> */
    public function findByCardOrdered(Card $card): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.card = :card')
            ->setParameter('card', $card)
            ->orderBy('c.createdAt', 'ASC')
            ->addOrderBy('c.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
