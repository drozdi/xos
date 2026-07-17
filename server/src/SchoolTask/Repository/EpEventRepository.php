<?php

namespace SchoolTask\Repository;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;
use SchoolTask\Entity\EpEvent;

/**
 * @extends AbstractRepository<EpEvent>
 */
class EpEventRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EpEvent::class);
    }

    public function save(EpEvent $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(EpEvent $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findInRange(\DateTimeInterface $start, \DateTimeInterface $end, array $filters = []): array
    {
        $qb = $this->createQueryBuilder('e')
            ->andWhere('e.start <= :end')
            ->andWhere('e.end >= :start')
            ->setParameter('start', $start)
            ->setParameter('end', $end);

        if (!empty($filters['class'])) {
            $qb->andWhere('e.class = :class')->setParameter('class', $filters['class']);
        }
        if (!empty($filters['user'])) {
            $qb->andWhere('e.user = :user')->setParameter('user', $filters['user']);
        }

        return $qb->orderBy('e.start', 'ASC')->getQuery()->getResult();
    }

    protected function filter(QueryBuilder $query, array $filters = [], string $n = 'en'): QueryBuilder
    {
        if (array_key_exists('class', $filters) && null !== $filters['class']) {
            $query->andWhere($this->fieldVal($n.'.class', $filters['class']));
            unset($filters['class']);
        }
        if (array_key_exists('user', $filters) && null !== $filters['user']) {
            $query->andWhere($this->fieldVal($n.'.user', $filters['user']));
            unset($filters['user']);
        }

        return parent::filter($query, $filters, $n);
    }
}
