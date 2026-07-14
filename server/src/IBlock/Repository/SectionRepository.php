<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\Section;

/**
 * @extends AbstractRepository<Section>
 */
class SectionRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Section::class);
    }

    public function save(Section $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Section $entity, bool $flush = false): void
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

        return parent::filter($query, $filters, $n);
    }
}
