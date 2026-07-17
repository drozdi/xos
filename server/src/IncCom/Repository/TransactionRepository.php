<?php

namespace IncCom\Repository;

use AbstractRepository;
use IncCom\Entity\Transaction;

use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<Transaction>
 *
 * @method Transaction|null find($id, $lockMode = null, $lockVersion = null)
 * @method Transaction|null findOneBy(array $criteria, array $orderBy = null)
 * @method Transaction[]    findAll()
 * @method Transaction[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TransactionRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Transaction::class);
    }

    protected function filter($query, array $filters = [], string $n = "en"): QueryBuilder
    {
        $authorFilter = $filters['author'] ?? $filters['owner'] ?? null;
        if (array_key_exists('author', $filters) || array_key_exists('owner', $filters)) {
            if (null === $authorFilter) {
                $query->andWhere($n.'.author IS NULL');
            } elseif (is_int($authorFilter) && $authorFilter > 0) {
                $query->andWhere($this->fieldVal($n.".author", $authorFilter));
            }
        }
        unset($filters['owner'], $filters['author']);

        if (array_key_exists('account', $filters)) {
            $accountId = (int) $filters['account'];
            unset($filters['account']);
            if ($accountId > 0) {
                $query->andWhere($query->expr()->eq("IDENTITY({$n}.account)", ':txnAccountId'));
                $query->setParameter('txnAccountId', $accountId);
            }
        }

        if (array_key_exists('category', $filters)) {
            $categoryId = (int) $filters['category'];
            unset($filters['category']);
            if ($categoryId > 0) {
                $query->andWhere($query->expr()->eq("IDENTITY({$n}.category)", ':txnCategoryId'));
                $query->setParameter('txnCategoryId', $categoryId);
            }
        }

        if (!empty($filters['dateFrom'])) {
            $query->andWhere($n.'.date >= :txnDateFrom');
            $query->setParameter('txnDateFrom', new \DateTime((string) $filters['dateFrom']));
            unset($filters['dateFrom']);
        }

        if (!empty($filters['dateTo'])) {
            $query->andWhere($n.'.date <= :txnDateTo');
            $query->setParameter('txnDateTo', new \DateTime((string) $filters['dateTo']));
            unset($filters['dateTo']);
        }

        return parent::filter($query, $filters, $n);
    }

    public function save(Transaction $entity, bool $flush = false): void
    {
        if (!(bool)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Transaction $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
