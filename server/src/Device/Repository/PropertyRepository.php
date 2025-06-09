<?php

namespace Device\Repository;

use AbstractRepository;
use Device\Entity\Property;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<OU>
 *
 * @method Property|null find($id, $lockMode = null, $lockVersion = null)
 * @method Property|null findOneBy(array $criteria, array $orderBy = null)
 * @method Property[]    findAll()
 * @method Property[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PropertyRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Property::class);
    }

    public function save(Property $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Property $entity, bool $flush = false): void
    {
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
        if (array_key_exists('type', $filters) && null === $filters['type']) {
            $query->andWhere($n.'.type IS NULL');
        } elseif (!empty($filters['type']) && is_int($filters['type']) && $filters['type'] > 0) {
            $query->andWhere($this->fieldVal($n.".type", $filters['type']));
        } elseif (!empty($filters['type']) && is_array($filter = $filters['type'])) {
            $query->innerJoin($n.'.type', $n.'type');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."type.{$field}", $val));
            }
        }
        unset($filters['type']);

        if (array_key_exists('prototype', $filters) && null === $filters['prototype']) {
            $query->andWhere($n.'.prototype IS NULL');
        } elseif (!empty($filters['prototype']) && is_int($filters['prototype']) && $filters['prototype'] > 0) {
            $query->andWhere($this->fieldVal($n.".prototype", $filters['prototype']));
        } elseif (!empty($filters['prototype']) && is_array($filter = $filters['prototype'])) {
            $query->innerJoin($n.'.prototype', $n.'pp');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."pp.{$field}", $val));
            }
        }
        unset($filters['type']);

        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return $query;
    }

    public function getProperties ($limit = null, $offset = 0) {
        $dql = 'SELECT p FROM '.Property::class.' p WHERE p.parent IS NULL AND p.type IS NULL ORDER BY p.sort ASC, p.name ASC';
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
        $dql = 'SELECT p FROM '.Property::class.' p WHERE p.parent IS NULL AND p.type IS NOT NULL ORDER BY p.sort ASC, p.name ASC';
        $query = $this->getEntityManager()->createQuery($dql);
        if ($limit && (int)$limit > 0) {
            $query->setMaxResults((int)$limit);
        }
        if ($offset && (int)$offset > 0) {
            $query->setFirstResult((int)$offset);
        }
        return $query->execute();
    }

//    /**
//     * @return OU[] Returns an array of Property objects
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

//    public function findOneBySomeField($value): ?Property
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
