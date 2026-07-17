<?php

namespace IncCom\Service;

use Doctrine\ORM\EntityManagerInterface;
use IncCom\Entity\Account;
use IncCom\Entity\Category;
use IncCom\Entity\Product;
use IncCom\Entity\Tag;
use IncCom\Entity\Transaction;
use IncCom\Entity\TransactionItem;

/**
 * Pre-deletion dependency checks for accounts, categories, products and tags.
 */
class DeletionGuardService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    public function assertAccountDeletable(Account $account): void
    {
        $count = (int) $this->em->createQueryBuilder()
            ->select('COUNT(t.id)')
            ->from(Transaction::class, 't')
            ->where('t.account = :account')
            ->setParameter('account', $account)
            ->getQuery()
            ->getSingleScalarResult();

        if ($count > 0) {
            throw new \LogicException('Cannot delete account: it has linked transactions.');
        }
    }

    public function assertCategoryDeletable(Category $category): void
    {
        $count = (int) $this->em->createQueryBuilder()
            ->select('COUNT(t.id)')
            ->from(Transaction::class, 't')
            ->where('t.category = :category')
            ->setParameter('category', $category)
            ->getQuery()
            ->getSingleScalarResult();

        if ($count > 0) {
            throw new \LogicException('Cannot delete category: it is used in transactions.');
        }
    }

    public function assertItemDeletable(Product $item): void
    {
        $count = (int) $this->em->createQueryBuilder()
            ->select('COUNT(ti.id)')
            ->from(TransactionItem::class, 'ti')
            ->where('ti.item = :item')
            ->setParameter('item', $item)
            ->getQuery()
            ->getSingleScalarResult();

        if ($count > 0) {
            throw new \LogicException('Cannot delete product: it is used in transaction items.');
        }
    }

    public function assertItemCategoryDeletable(Tag $tag): void
    {
        if ($this->countProductsForTag($tag) > 0) {
            throw new \LogicException('Cannot delete item category: it has linked products.');
        }

        if ($this->hasChildTagsWithProducts($tag)) {
            throw new \LogicException('Cannot delete item category: child categories have linked products.');
        }
    }

    private function countProductsForTag(Tag $tag): int
    {
        return (int) $this->em->createQueryBuilder()
            ->select('COUNT(DISTINCT p.id)')
            ->from(Product::class, 'p')
            ->innerJoin('p.itemCategories', 't')
            ->where('t = :tag')
            ->setParameter('tag', $tag)
            ->getQuery()
            ->getSingleScalarResult();
    }

    private function hasChildTagsWithProducts(Tag $tag): bool
    {
        $tagId = $tag->getId();
        if ($tagId === null) {
            return false;
        }

        $count = (int) $this->em->createQueryBuilder()
            ->select('COUNT(DISTINCT p.id)')
            ->from(Product::class, 'p')
            ->innerJoin('p.itemCategories', 'child')
            ->innerJoin('child.parent', 'parent')
            ->where('parent = :tag')
            ->setParameter('tag', $tag)
            ->getQuery()
            ->getSingleScalarResult();

        return $count > 0;
    }
}
