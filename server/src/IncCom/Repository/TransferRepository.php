<?php

namespace IncCom\Repository;

use AbstractRepository;
use IncCom\Entity\Transfer;

use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<Transfer>
 *
 * @method Transfer|null find($id, $lockMode = null, $lockVersion = null)
 * @method Transfer|null findOneBy(array $criteria, array $orderBy = null)
 * @method Transfer[]    findAll()
 * @method Transfer[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TransferRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Transfer::class);
    }

    protected function filter($query, array $filters = [], string $n = "en"): QueryBuilder
    {
        if (array_key_exists('accessibleTo', $filters)) {
            $userId = (int) $filters['accessibleTo'];
            unset($filters['accessibleTo']);

            if ($userId > 0) {
                $query->leftJoin($n.'.fromAccount', $n.'_xfer_from');
                $query->leftJoin($n.'.toAccount', $n.'_xfer_to');
                $query->leftJoin($n.'_xfer_from.users', $n.'_xfer_from_users');
                $query->leftJoin($n.'_xfer_to.users', $n.'_xfer_to_users');
                $query->andWhere($query->expr()->orX(
                    $query->expr()->eq("IDENTITY({$n}_xfer_from.owner)", ':xferAccessibleUserId'),
                    $query->expr()->eq("IDENTITY({$n}_xfer_to.owner)", ':xferAccessibleUserId'),
                    $query->expr()->eq($n.'_xfer_from_users.id', ':xferAccessibleUserId'),
                    $query->expr()->eq($n.'_xfer_to_users.id', ':xferAccessibleUserId'),
                ));
                $query->setParameter('xferAccessibleUserId', $userId);
                $query->distinct();
            }
        }

        if (array_key_exists('fromAccount', $filters)) {
            $fromAccountId = (int) $filters['fromAccount'];
            unset($filters['fromAccount']);
            if ($fromAccountId > 0) {
                $query->andWhere($query->expr()->eq("IDENTITY({$n}.fromAccount)", ':xferFromAccountId'));
                $query->setParameter('xferFromAccountId', $fromAccountId);
            }
        }

        if (array_key_exists('toAccount', $filters)) {
            $toAccountId = (int) $filters['toAccount'];
            unset($filters['toAccount']);
            if ($toAccountId > 0) {
                $query->andWhere($query->expr()->eq("IDENTITY({$n}.toAccount)", ':xferToAccountId'));
                $query->setParameter('xferToAccountId', $toAccountId);
            }
        }

        if (!empty($filters['dateFrom'])) {
            $query->andWhere($n.'.date >= :xferDateFrom');
            $query->setParameter('xferDateFrom', new \DateTime((string) $filters['dateFrom']));
            unset($filters['dateFrom']);
        }

        if (!empty($filters['dateTo'])) {
            $query->andWhere($n.'.date <= :xferDateTo');
            $query->setParameter('xferDateTo', new \DateTime((string) $filters['dateTo']));
            unset($filters['dateTo']);
        }

        $authorFilter = $filters['author'] ?? null;
        if (array_key_exists('author', $filters)) {
            if (null === $authorFilter) {
                $query->andWhere($n.'.author IS NULL');
            } elseif (is_int($authorFilter) && $authorFilter > 0) {
                $query->andWhere($this->fieldVal($n.".author", $authorFilter));
            }
        }
        unset($filters['author']);

        return parent::filter($query, $filters, $n);
    }

    public function save(Transfer $entity, bool $flush = false): void
    {
        if (!(bool)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Transfer $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
