<?php

namespace IncCom\Repository;

use AbstractRepository;
use IncCom\Entity\Tag;

use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<Tag>
 *
 * @method Tag|null find($id, $lockMode = null, $lockVersion = null)
 * @method Tag|null findOneBy(array $criteria, array $orderBy = null)
 * @method Tag[]    findAll()
 * @method Tag[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TagRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Tag::class);
    }

    protected function filter($query, array $filters = [], string $n = "en"): QueryBuilder
    {
        $userFilter = $filters['user'] ?? $filters['owner'] ?? null;
        if (array_key_exists('user', $filters) || array_key_exists('owner', $filters)) {
            if (null === $userFilter) {
                $query->andWhere($n.'.owner IS NULL');
            } elseif (is_int($userFilter) && $userFilter > 0) {
                $query->andWhere($this->fieldVal($n.".owner", $userFilter));
            }
        }
        unset($filters['owner'], $filters['user']);

        if (array_key_exists('parent', $filters)) {
            $parent = $filters['parent'];
            unset($filters['parent']);
            if ($parent === 'null' || $parent === null || $parent === '') {
                $query->andWhere($n.'.parent IS NULL');
            } elseif (is_numeric($parent) && (int) $parent > 0) {
                $query->andWhere($query->expr()->eq("IDENTITY({$n}.parent)", ':tagParentId'));
                $query->setParameter('tagParentId', (int) $parent);
            }
        }

        if (!empty($filters['search']) && is_string($filters['search'])) {
            $search = '%'.addcslashes($filters['search'], '%_').'%';
            $query->andWhere($query->expr()->orX(
                $query->expr()->like($n.'.label', ':tagSearch'),
                $query->expr()->like($n.'.keywords', ':tagSearch'),
            ));
            $query->setParameter('tagSearch', $search);
            unset($filters['search']);
        }

        return parent::filter($query, $filters, $n);
    }

    public function countChildren(Tag $tag): int
    {
        return (int) $this->createQueryBuilder('t')
            ->select('COUNT(t.id)')
            ->where('t.parent = :parent')
            ->setParameter('parent', $tag)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function isDescendantOf(Tag $ancestor, Tag $node): bool
    {
        $current = $node->getParent();
        while ($current !== null) {
            if ($current->getId() === $ancestor->getId()) {
                return true;
            }
            $current = $current->getParent();
        }

        return false;
    }

    public function save(Tag $entity, bool $flush = false): void
    {
        if (!(bool)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Tag $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
