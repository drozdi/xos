<?php

namespace Board\Repository;

use Board\Entity\Checklist;
use Board\Entity\ChecklistItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChecklistItem>
 */
class ChecklistItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChecklistItem::class);
    }

    public function getMaxPosition(Checklist $checklist): ?int
    {
        $result = $this->createQueryBuilder('i')
            ->select('MAX(i.position)')
            ->andWhere('i.checklist = :checklist')
            ->setParameter('checklist', $checklist)
            ->getQuery()
            ->getSingleScalarResult();

        return null !== $result ? (int) $result : null;
    }
}
