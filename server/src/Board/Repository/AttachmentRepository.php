<?php

namespace Board\Repository;

use Board\Entity\Attachment;
use Board\Entity\Card;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Attachment>
 */
class AttachmentRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Attachment::class);
    }

    /** @return list<Attachment> */
    public function findByCard(Card $card): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.card = :card')
            ->setParameter('card', $card)
            ->orderBy('a.createdAt', 'DESC')
            ->addOrderBy('a.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
