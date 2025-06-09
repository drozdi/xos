<?php

namespace Device\Repository\License;

use AbstractRepository;
use Device\Entity\License\Software;
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
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Software::class);
    }

    public function save(Software $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Software $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "ls"): QueryBuilder {
        if (array_key_exists('license', $filters) && null === $filters['license']) {
            $query->andWhere($n.'.license IS NULL');
        } elseif (!empty($filters['license']) && is_int($filters['license']) && $filters['license'] > 0) {
            $query->andWhere($this->fieldVal($n.".license", $filters['license']));
        } elseif (!empty($filters['license']) && is_array($filter = $filters['license'])) {
            $query->innerJoin($n.'.license', $n.'l');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."l.{$field}", $val));
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
