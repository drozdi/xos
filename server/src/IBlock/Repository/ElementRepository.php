<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\Element;

/**
 * @extends AbstractRepository<Element>
 */
class ElementRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Element::class);
    }

    public function save(Element $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Element $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter(QueryBuilder $query, array $filters = [], string $n = 'e'): QueryBuilder
    {
        if (isset($filters['block_id']) && '' !== $filters['block_id'] && null !== $filters['block_id']) {
            $query->andWhere($n.'.block = :block_id')->setParameter('block_id', (int) $filters['block_id']);
        }
        unset($filters['block_id']);

        if (isset($filters['section_id']) && '' !== $filters['section_id'] && null !== $filters['section_id']) {
            $query->andWhere($n.'.section = :section_id')->setParameter('section_id', (int) $filters['section_id']);
        }
        unset($filters['section_id']);

        if (array_key_exists('active', $filters) && null !== $filters['active'] && '' !== $filters['active']) {
            $query->andWhere($n.'.active = :active')->setParameter('active', (bool) $filters['active']);
        }
        unset($filters['active']);

        if (!empty($filters['code'])) {
            $query->andWhere($n.'.code LIKE :code')->setParameter('code', '%'.$filters['code'].'%');
        }
        unset($filters['code']);

        if (!empty($filters['name'])) {
            $query->andWhere($n.'.name LIKE :name')->setParameter('name', '%'.$filters['name'].'%');
        }
        unset($filters['name']);

        foreach ($filters as $field => $value) {
            $query->andWhere($this->fieldVal($n.'.'.$field, $value));
        }

        return $query;
    }
}
