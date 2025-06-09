<?php

namespace Device\Repository;

use AbstractRepository;
use Device\Entity\Type;
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
class TypeRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry) {
        parent::__construct($registry, Type::class);
    }

    public function save(Type $entity, bool $flush = false): void {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Type $entity, bool $flush = false): void {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "t"): QueryBuilder {
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
        if (array_key_exists('property', $filters) && null === $filters['property']) {
            $query->andWhere($n.'.property IS NULL');
        } elseif (!empty($filters['property']) && is_int($filters['property']) && $filters['property'] > 0) {
            $query->andWhere($this->fieldVal($n.".property", $filters['property']));
        } elseif (!empty($filters['property']) && is_array($filter = $filters['property'])) {
            $query->innerJoin($n.'.property', $n.'prop');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."prop.{$field}", $val));
            }
        }
        unset($filters['property']);

        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return $query;
    }

    public function getTypes ($limit = null, $offset = 0) {
        $dql = 'SELECT p FROM '.Type::class.' p WHERE p.parent IS NULL AND p.property IS NULL ORDER BY p.sort ASC, p.name ASC';
        $query = $this->getEntityManager()->createQuery($dql);
        if ($limit && (int)$limit > 0) {
            $query->setMaxResults((int)$limit);
        }
        if ($offset && (int)$offset > 0) {
            $query->setFirstResult((int)$offset);
        }
        return $query->execute();
    }
    public function getComponents ($limit = null, $offset = 0) {
        $dql = 'SELECT t FROM '.Type::class.' t JOIN t.property p WHERE t.property IS NOT NULL ORDER BY t.sort ASC, t.name ASC';
        $query = $this->getEntityManager()->createQuery($dql);
        if ($limit && (int)$limit > 0) {
            $query->setMaxResults((int)$limit);
        }
        if ($offset && (int)$offset > 0) {
            $query->setFirstResult((int)$offset);
        }
        return $query->execute();
    }
    /*protected function order (QueryBuilder $query, array $sort = array(), string $n = "s"): QueryBuilder {
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
    }*/




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
