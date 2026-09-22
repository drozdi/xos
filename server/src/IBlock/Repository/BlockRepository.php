<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\Block;

/**
 * @extends AbstractRepository<Block>
 */
class BlockRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Block::class);
    }

    public function save(Block $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Block $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter(QueryBuilder $query, array $filters = [], string $n = 'e'): QueryBuilder
    {
        if (isset($filters['type_id']) && '' !== $filters['type_id'] && null !== $filters['type_id']) {
            $query->andWhere($n.'.type = :type_id')->setParameter('type_id', (int) $filters['type_id']);
        }
        unset($filters['type_id']);

        return parent::filter($query, $filters, $n);
    }
}
