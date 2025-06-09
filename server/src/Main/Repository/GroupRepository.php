<?php

namespace Main\Repository;

use AbstractRepository;
use Main\Entity\Group;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

use Doctrine\ORM\QueryBuilder;

/**
 * @extends ServiceEntityRepository<Group>
 *
 * @method Group|null find($id, $lockMode = null, $lockVersion = null)
 * @method Group|null findOneBy(array $criteria, array $orderBy = null)
 * @method Group[]    findAll()
 * @method Group[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class GroupRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Group::class);
    }

    public function save(Group $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Group $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "g"): QueryBuilder {
        if (array_key_exists('ou', $filters) && null === $filters['ou']) {
            $query->andWhere($n.'.ou IS NULL');
        } elseif (!empty($filters['ou']) && is_int($filters['ou']) && $filters['ou'] > 0) {
            $query->andWhere($this->fieldVal($n.".ou", $filters['ou']));
        } elseif (!empty($filters['ou']) && is_array($filter = $filters['ou'])) {
            $query->innerJoin($n.'.ou', $n.'ou');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."ou.{$field}", $val));
            }
        }
        /*if (!empty($filters['group']) && is_array($filter = $filters['group'])) {
            $query->innerJoin('u.groups', 'ug');
            $query->innerJoin('ug.group', 'g');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal("g.{$field}", $val));
            }
        }*/
        return $query;
    }
    protected function order (QueryBuilder $query, array $sort = array(), string $n = "g"): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $order = strtoupper($sortBy['order'])=="DESC"? "DESC": "ASC";
                switch ($sortBy['key']) {
                    case 'ou':
                        $query->join($n.'.ou', $n.'ou')
                            ->addOrderBy($n.'ou.code', $order);
                        break;
                    case 'tutor':
                        $query->join($n.'.user', $n.'u')
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
//     * @return Group[] Returns an array of Group objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('g')
//            ->andWhere('g.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('g.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Group
//    {
//        return $this->createQueryBuilder('g')
//            ->andWhere('g.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
