<?php

namespace Device\Repository\Software;

use Device\Entity\Software\Type;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Type>
 *
 * @method Type|null find($id, $lockMode = null, $lockVersion = null)
 * @method Type|null findOneBy(array $criteria, array $orderBy = null)
 * @method Type[]    findAll()
 * @method Type[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TypeRepository extends \AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Type::class);
    }

    public function save(Type $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
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

    protected function order(\Doctrine\ORM\QueryBuilder $query, array $sort = [], string $n = 't'): \Doctrine\ORM\QueryBuilder
    {
        $allowed = ['id', 'name', 'code', 'sort'];
        foreach ($sort as $sortBy) {
            if (!\is_array($sortBy)) {
                continue;
            }
            $key = (string) ($sortBy['key'] ?? '');
            if (!\in_array($key, $allowed, true)) {
                continue;
            }
            $order = strtoupper((string) ($sortBy['order'] ?? 'ASC')) === 'DESC' ? 'DESC' : 'ASC';
            $query->addOrderBy($n.'.'.$key, $order);
        }

        return $query;
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
