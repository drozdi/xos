<?php

namespace Device\Repository\Software;

use Device\Entity\Software\Type;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<OU>
 *
 * @method Type|null find($id, $lockMode = null, $lockVersion = null)
 * @method Type|null findOneBy(array $criteria, array $orderBy = null)
 * @method Type[]    findAll()
 * @method Type[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TypeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Type::class);
    }

    public function save(Type $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Type $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function fieldVal ($field, $val): ?string {
        $not = false;
        if (substr($field, -1) === "!") {
            $not = true;
            $field = substr($field, 0, -1);
        }
        if (null === $val) {
            return "{$field} IS ".($not? "NOT ": "")."NULL";
        } elseif (is_array($val) && count($val) > 0) {
            return "{$field} ".($not? "NOT ":"")."IN ('".implode("', '", $val)."')";
        } else {
            return "{$field} ".($not? "<> ": "=")." '{$val}'";
        }
        return null;
    }
    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "t"): QueryBuilder {
        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return $query;
    }
    protected function order (QueryBuilder $query, array $sort = array(), string $n = "t"): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $order = strtoupper($sortBy['order'])=="DESC"? "DESC": "ASC";
                $query->addOrderBy($n.'.' . $sortBy['key'], $order);
            }
        }
        return $query;
    }

    public function getQueryBuilder (array $filters = array(), array $sort = array(), int $limit = 0, int $offset = 1, string $n = "t"): QueryBuilder {
        $query = $this->createQueryBuilder($n);
        $query = $this->filter($query, $filters, $n);
        $query = $this->order($query, $sort, $n);
        if ($limit > 0) {
            $query->setMaxResults($limit);
            $query->setFirstResult($limit * ($offset - 1));
        }
        return $query;
    }

    public function findFilter (array $filters = array(), array $sort = array(), int $limit = 0, int $offset = 1, string $n = "t"): array {
        return $this->getQueryBuilder($filters, $sort, $limit, $offset)->getQuery()->execute();
    }
    public function cnt (array $filters = array()): int {
        $query = $this->createQueryBuilder("t");
        $query = $this->filter($query, $filters, "t");
        $query->select($query->expr()->countDistinct("t"));
        return (int)$query->getQuery()->execute()[0][1];
    }


//    /**
//     * @return OU[] Returns an array of Type objects
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

//    public function findOneBySomeField($value): ?Type
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
