<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\SectionProperty;

/**
 * @extends AbstractRepository<SectionProperty>
 */
class SectionPropertyRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SectionProperty::class);
    }

    public function save(SectionProperty $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(SectionProperty $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter(QueryBuilder $query, array $filters = [], string $n = 'sp'): QueryBuilder
    {
        if (isset($filters['section_id']) && '' !== $filters['section_id'] && null !== $filters['section_id']) {
            $query->andWhere($n.'.section = :section_id')->setParameter('section_id', (int) $filters['section_id']);
        }
        unset($filters['section_id']);

        if (isset($filters['block_id']) && '' !== $filters['block_id'] && null !== $filters['block_id']) {
            $query->andWhere($n.'.block = :block_id')->setParameter('block_id', (int) $filters['block_id']);
        }
        unset($filters['block_id']);

        if (isset($filters['property_id']) && '' !== $filters['property_id'] && null !== $filters['property_id']) {
            $query->andWhere($n.'.property = :property_id')->setParameter('property_id', (int) $filters['property_id']);
        }
        unset($filters['property_id']);

        if (array_key_exists('smart_filter', $filters) && null !== $filters['smart_filter'] && '' !== $filters['smart_filter']) {
            $query->andWhere($n.'.smartFilter = :smart_filter')->setParameter('smart_filter', (bool) $filters['smart_filter']);
        }
        unset($filters['smart_filter']);

        if (array_key_exists('active', $filters) && null !== $filters['active'] && '' !== $filters['active']) {
            $query->andWhere($n.'.active = :active')->setParameter('active', (bool) $filters['active']);
        }
        unset($filters['active']);

        foreach ($filters as $field => $value) {
            $query->andWhere($this->fieldVal($n.'.'.$field, $value));
        }

        return $query;
    }
}
