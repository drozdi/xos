<?php

namespace IncCom\Repository;

use AbstractRepository;
use IncCom\Entity\Category;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

use Doctrine\ORM\QueryBuilder;

/**
 * @extends ServiceEntityRepository<Category>
 *
 * @method Category|null find($id, $lockMode = null, $lockVersion = null)
 * @method Category|null findOneBy(array $criteria, array $orderBy = null)
 * @method Category[]    findAll()
 * @method Category[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CategoryRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Category::class);
    }

    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "en"): QueryBuilder {
        $createdByFilter = $filters['createdBy'] ?? $filters['owner'] ?? null;
        if (array_key_exists('createdBy', $filters) || array_key_exists('owner', $filters)) {
            if (null === $createdByFilter) {
                $query->andWhere($n.'.createdBy IS NULL');
            } elseif (is_int($createdByFilter) && $createdByFilter > 0) {
                $query->andWhere($this->fieldVal($n.".createdBy", $createdByFilter));
            } elseif (is_array($createdByFilter)) {
                $query->innerJoin($n.'.createdBy', $n.'createdBy');
                foreach ($createdByFilter as $field => $val) {
                    $query->andWhere($this->fieldVal($n."createdBy.{$field}", $val));
                }
            }
        }
        unset($filters['owner'], $filters['createdBy']);
//        if (array_key_exists('account', $filters) && null === $filters['account']) {
//            $query->andWhere($n.'.account IS NULL');
//        } elseif (!empty($filters['account']) && is_int($filters['account']) && $filters['account'] > 0) {
//            $query->andWhere($this->fieldVal($n.".account", $filters['account']));
//        } elseif (!empty($filters['account']) && is_array($filter = $filters['account'])) {
//            $query->innerJoin($n.'.account', $n.'account');
//            foreach ($filter as $field => $val) {
//                $query->andWhere($this->fieldVal($n."account.{$field}", $val));
//            }
//        }
//        unset($filters['account']);
        foreach ($filters as $f => $v) {
            $query->andWhere($this->fieldVal($n.".{$f}", $v));
        }
        return  $query;
    }
    public function save(Category $entity, bool $flush = false): void
    {
        if (!(bool)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Category $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

}
