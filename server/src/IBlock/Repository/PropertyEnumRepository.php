<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\Property\Enum as PropertyEnum;

/**
 * @extends AbstractRepository<PropertyEnum>
 */
class PropertyEnumRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PropertyEnum::class);
    }

    public function save(PropertyEnum $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PropertyEnum $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter(QueryBuilder $query, array $filters = [], string $n = 'pe'): QueryBuilder
    {
        if (isset($filters['property_id']) && '' !== $filters['property_id'] && null !== $filters['property_id']) {
            $query->andWhere($n.'.property = :property_id')->setParameter('property_id', (int) $filters['property_id']);
        }
        unset($filters['property_id']);

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
