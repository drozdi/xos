<?php

namespace IncCom\Repository;

use AbstractRepository;
use IncCom\Entity\Product;

use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<Product>
 *
 * @method Product|null find($id, $lockMode = null, $lockVersion = null)
 * @method Product|null findOneBy(array $criteria, array $orderBy = null)
 * @method Product[]    findAll()
 * @method Product[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class ProductRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Product::class);
    }

    protected function filter($query, array $filters = [], string $n = "en"): QueryBuilder
    {
        $userFilter = $filters['user'] ?? null;
        if (array_key_exists('user', $filters)) {
            if (null === $userFilter) {
                $query->andWhere($n.'.user IS NULL');
            } elseif (is_int($userFilter) && $userFilter > 0) {
                $query->andWhere($this->fieldVal($n.".user", $userFilter));
            }
        }
        unset($filters['user']);

        if (array_key_exists('category', $filters)) {
            $categoryId = (int) $filters['category'];
            unset($filters['category']);
            if ($categoryId > 0) {
                $query->innerJoin($n.'.itemCategories', $n.'_item_cat');
                $query->andWhere($n.'_item_cat.id = :productCategoryId');
                $query->setParameter('productCategoryId', $categoryId);
            }
        }

        if (!empty($filters['search']) && is_string($filters['search'])) {
            $search = '%'.addcslashes($filters['search'], '%_').'%';
            $query->andWhere($query->expr()->orX(
                $query->expr()->like($n.'.label', ':productSearch'),
                $query->expr()->like($n.'.description', ':productSearch'),
            ));
            $query->setParameter('productSearch', $search);
            unset($filters['search']);
        }

        return parent::filter($query, $filters, $n);
    }

    public function findOneByUserAndName(int $userId, string $name): ?Product
    {
        return $this->createQueryBuilder('p')
            ->where('IDENTITY(p.user) = :userId')
            ->andWhere('p.label = :name')
            ->setParameter('userId', $userId)
            ->setParameter('name', $name)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function save(Product $entity, bool $flush = false): void
    {
        if (!(bool)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Product $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
