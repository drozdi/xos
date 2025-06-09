<?php

namespace Device\Repository;

use AbstractRepository;
use Device\Entity\Accounting;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<Accounting>
 *
 * @method Accounting|null find($id, $lockMode = null, $lockVersion = null)
 * @method Accounting|null findOneBy(array $criteria, array $orderBy = null)
 * @method Accounting[]    findAll()
 * @method Accounting[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AccountingRepository extends AbstractRepository
{
    public function __construct (ManagerRegistry $registry) {
        parent::__construct($registry, Accounting::class);
    }
    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "a"): QueryBuilder {
        if (array_key_exists('parent', $filters) && null === $filters['parent']) {
            $query->andWhere($n.'.parent IS NULL');
        } elseif (!empty($filters['parent']) && is_int($filters['parent']) && $filters['parent'] > 0) {
            $query->andWhere($this->fieldVal($n.".parent", $filters['parent']));
        } elseif (!empty($filters['parent']) && is_array($filter = $filters['parent'])) {
            $query->innerJoin($n.'.parent', $n.'p');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."p.{$field}", $val));
            }
        }
        unset($filters['parent']);
        if (array_key_exists('device', $filters) && null === $filters['device']) {
            $query->andWhere($n.'.device IS NULL');
        } elseif (!empty($filters['device']) && is_int($filters['device']) && $filters['device'] > 0) {
            $query->andWhere($this->fieldVal($n.".device", $filters['device']));
        } elseif (!empty($filters['device']) && is_array($filter = $filters['device'])) {
            $query->innerJoin($n.'.device', $n.'d');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."d.{$field}", $val));
            }
        }
        unset($filters['device']);

        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return $query;
    }
    protected function order (QueryBuilder $query, array $sort = array(), string $n = "en"): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $order = strtoupper($sortBy['order'])=="DESC"? "DESC": "ASC";
                $query->addOrderBy($n.'.' . $sortBy['key'], $order);
            }
        }
        return $query;
    }


    public function save (Accounting $entity, bool $flush = false): void {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove (Accounting $entity, bool $flush = false): void {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }




//    /**
//     * @return Device[] Returns an array of Device objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('o.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Device
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
