<?php

namespace Device\Repository;

use AbstractRepository;
use Device\Entity\Device;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<Device>
 *
 * @method Device|null find($id, $lockMode = null, $lockVersion = null)
 * @method Device|null findOneBy(array $criteria, array $orderBy = null)
 * @method Device[]    findAll()
 * @method Device[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class DeviceRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Device::class);
    }

    public function save(Device $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Device $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "d"): QueryBuilder {
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
            $query->innerJoin($n.'.type', $n.'t');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."t.{$field}", $val));
            }
        }
        unset($filters['type']);
        if (array_key_exists('accounting', $filters) && null === $filters['accounting']) {
            $query->andWhere($n.'.accounting IS NULL');
        } elseif (!empty($filters['accounting']) && is_int($filters['accounting']) && $filters['accounting'] > 0) {
            $query->andWhere($this->fieldVal($n.".accounting", $filters['accounting']));
        } elseif (!empty($filters['accounting']) && is_array($filter = $filters['accounting'])) {
            $query->innerJoin($n.'.accounting', $n.'a');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."a.{$field}", $val));
            }
        }
        unset($filters['accounting']);

        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return $query;
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
