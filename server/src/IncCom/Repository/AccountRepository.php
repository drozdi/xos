<?php

namespace IncCom\Repository;

use AbstractRepository;
use IncCom\Entity\Account;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\Security\Core\Exception\AuthenticationException;

use Doctrine\ORM\QueryBuilder;

/**
 * @extends ServiceEntityRepository<Account>
 *
 * @method Account|null find($id, $lockMode = null, $lockVersion = null)
 * @method Account|null findOneBy(array $criteria, array $orderBy = null)
 * @method Account[]    findAll()
 * @method Account[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class AccountRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Account::class);
    }

    public function save(Account $entity, bool $flush = false): void
    {
        if (!(bool)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Account $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    protected function filter(QueryBuilder $query, array $filters = array(), string $n = "en"): QueryBuilder
    {
        if (array_key_exists('accessibleTo', $filters)) {
            $userId = (int) $filters['accessibleTo'];
            unset($filters['accessibleTo']);

            if ($userId > 0) {
                $query->leftJoin($n.'.users', $n.'_acc_user');
                $query->andWhere(
                    $query->expr()->orX(
                        $query->expr()->eq("IDENTITY({$n}.owner)", ':accAccessibleUserId'),
                        $query->expr()->eq($n.'_acc_user.id', ':accAccessibleUserId'),
                    )
                );
                $query->setParameter('accAccessibleUserId', $userId);
                $query->distinct();
            }
        }

        return parent::filter($query, $filters, $n);
    }

}
