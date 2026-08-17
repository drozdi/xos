<?php

namespace Board\Repository;

use Board\Entity\Card;
use Board\Entity\Checklist;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Checklist>
 */
class ChecklistRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Checklist::class);
    }

    /** @return list<Checklist> */
    public function findByCardOrdered(Card $card): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.card = :card')
            ->setParameter('card', $card)
            ->orderBy('c.position', 'ASC')
            ->addOrderBy('c.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getMaxPosition(Card $card): ?int
    {
        $result = $this->createQueryBuilder('c')
            ->select('MAX(c.position)')
            ->andWhere('c.card = :card')
            ->setParameter('card', $card)
            ->getQuery()
            ->getSingleScalarResult();

        return null !== $result ? (int) $result : null;
    }
}
