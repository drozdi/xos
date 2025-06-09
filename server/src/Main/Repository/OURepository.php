<?php

namespace Main\Repository;

use AbstractRepository;
use Main\Entity\OU;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;


/**
 * @extends ServiceEntityRepository<OU>
 *
 * @method OU|null find($id, $lockMode = null, $lockVersion = null)
 * @method OU|null findOneBy(array $criteria, array $orderBy = null)
 * @method OU[]    findAll()
 * @method OU[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class OURepository extends  AbstractRepository {
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OU::class);
    }

    public function save(OU $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(OU $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function order (QueryBuilder $query, array $sort = array(), string $n = "en"): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $order = strtoupper($sortBy['order'])=="DESC"? "DESC": "ASC";
                switch ($sortBy['key']) {
                    case 'tutor':
                        $query->join($n.'.' . 'user', $n.'u')
                            ->addOrderBy($n.'u.login', $order);
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
//     * @return OU[] Returns an array of OU objects
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

//    public function findOneBySomeField($value): ?OU
//    {
//        return $this->createQueryBuilder('o')
//            ->andWhere('o.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
