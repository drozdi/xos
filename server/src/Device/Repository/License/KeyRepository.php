<?php

namespace Device\Repository\License;

use AbstractRepository;
use Device\Entity\License\Key;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<OU>
 *
 * @method Key|null find($id, $lockMode = null, $lockVersion = null)
 * @method Key|null findOneBy(array $criteria, array $orderBy = null)
 * @method Key[]    findAll()
 * @method Key[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class KeyRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Key::class);
    }

    public function save(Key $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Key $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "lk"): QueryBuilder {
        if (array_key_exists('licenseSoftware', $filters) && null === $filters['licenseSoftware']) {
            $query->andWhere($n.'.licenseSoftware IS NULL');
        } elseif (!empty($filters['licenseSoftware']) && is_int($filters['licenseSoftware']) && $filters['licenseSoftware'] > 0) {
            $query->andWhere($this->fieldVal($n.".licenseSoftware", $filters['licenseSoftware']));
        } elseif (!empty($filters['licenseSoftware']) && is_array($filter = $filters['licenseSoftware'])) {
            $query->innerJoin($n.'.licenseSoftware', $n.'ls');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."ls.{$field}", $val));
            }
        }
        unset($filters['license']);
        if (array_key_exists('software', $filters) && null === $filters['software']) {
            $query->andWhere($n.'.software IS NULL');
        } elseif (!empty($filters['software']) && is_int($filters['software']) && $filters['software'] > 0) {
            $query->andWhere($this->fieldVal($n.".software", $filters['software']));
        } elseif (!empty($filters['software']) && is_array($filter = $filters['software'])) {
            $query->innerJoin($n.'.software', $n.'s');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."s.{$field}", $val));
            }
        }
        unset($filters['software']);
        return parent::filter($query, $filters, $n);
    }




//    /**
//     * @return OU[] Returns an array of Key objects
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

//    public function findOneBySomeField($value): ?Key
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
