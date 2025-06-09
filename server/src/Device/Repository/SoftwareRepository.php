<?php

namespace Device\Repository;

use AbstractRepository;
use Device\Entity\Software;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<OU>
 *
 * @method Software|null find($id, $lockMode = null, $lockVersion = null)
 * @method Software|null findOneBy(array $criteria, array $orderBy = null)
 * @method Software[]    findAll()
 * @method Software[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class SoftwareRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry) {
        parent::__construct($registry, Software::class);
    }

    public function save(Software $entity, bool $flush = false): void {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Software $entity, bool $flush = false): void {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "s"): QueryBuilder {
        if (!empty($filters['type']) && is_int($filters['type']) && $filters['type'] > 0) {
            $query->andWhere($this->fieldVal($n.".type", $filters['type']));
        } elseif (!empty($filters['type']) && is_array($filter = $filters['type'])) {
            $query->innerJoin($n.'.type', $n.'t');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."t.{$field}", $val));
            }
        }
        unset($filters['type']);
        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return $query;
    }
    protected function order (QueryBuilder $query, array $sort = array(), string $n = "s"): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $order = strtoupper($sortBy['order'])=="DESC"? "DESC": "ASC";
                switch ($sortBy['key']) {
                    case 'type':
                        $query->join($n.'.type', $n.'t')
                            ->addOrderBy($n.'t.name', $order);
                        break;
                    default:
                        $query->addOrderBy($n.'.' . $sortBy['key'], $order);
                        break;
                }

            }
        }
        return $query;
    }

//    /**
//     * @return OU[] Returns an array of Software objects
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

//    public function findOneBySomeField($value): ?Software
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
