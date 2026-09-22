<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\SectionElement;

/**
 * @extends AbstractRepository<SectionElement>
 */
class SectionElementRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SectionElement::class);
    }

    public function save(SectionElement $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(SectionElement $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /** @return list<SectionElement> */
    public function findByElement(int $elementId): array
    {
        return $this->findBy(['element' => $elementId]);
    }

    /** @return list<int> */
    public function findElementIdsBySectionIds(array $sectionIds): array
    {
        if ([] === $sectionIds) {
            return [];
        }

        $rows = $this->createQueryBuilder('se')
            ->select('DISTINCT IDENTITY(se.element) AS eid')
            ->where('se.section IN (:ids)')
            ->setParameter('ids', $sectionIds)
            ->getQuery()
            ->getScalarResult();

        return array_values(array_map(static fn (array $r): int => (int) $r['eid'], $rows));
    }
}
