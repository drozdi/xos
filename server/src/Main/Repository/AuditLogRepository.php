<?php

namespace Main\Repository;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\AuditLog;

/**
 * @extends AbstractRepository<AuditLog>
 *
 * @method AuditLog|null find($id, $lockMode = null, $lockVersion = null)
 * @method AuditLog|null findOneBy(array $criteria, array $orderBy = null)
 * @method AuditLog[]    findAll()
 * @method AuditLog[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AuditLogRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AuditLog::class);
    }

    public function save(AuditLog $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter(QueryBuilder $query, array $filters = [], string $n = 'a'): QueryBuilder
    {
        if (!empty($filters['action']) && is_string($filters['action'])) {
            $query->andWhere($n.'.action = :action')->setParameter('action', $filters['action']);
        }
        if (!empty($filters['entity_type']) && is_string($filters['entity_type'])) {
            $query->andWhere($n.'.entityType = :entityType')->setParameter('entityType', $filters['entity_type']);
        }
        if (array_key_exists('entity_id', $filters) && null !== $filters['entity_id'] && '' !== $filters['entity_id']) {
            $query->andWhere($n.'.entityId = :entityId')->setParameter('entityId', (int) $filters['entity_id']);
        }
        if (array_key_exists('actor_id', $filters) && null !== $filters['actor_id'] && '' !== $filters['actor_id']) {
            $query->andWhere($n.'.actorId = :actorId')->setParameter('actorId', (int) $filters['actor_id']);
        }
        if (!empty($filters['q']) && is_string($filters['q'])) {
            $query->andWhere($n.'.summary LIKE :q OR '.$n.'.actorLabel LIKE :q')
                ->setParameter('q', '%'.$filters['q'].'%');
        }

        return $query;
    }
}
