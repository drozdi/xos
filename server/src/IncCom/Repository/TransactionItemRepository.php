<?php

namespace IncCom\Repository;

use AbstractRepository;
use IncCom\Entity\TransactionItem;

use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<TransactionItem>
 *
 * @method TransactionItem|null find($id, $lockMode = null, $lockVersion = null)
 * @method TransactionItem|null findOneBy(array $criteria, array $orderBy = null)
 * @method TransactionItem[]    findAll()
 * @method TransactionItem[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class TransactionItemRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TransactionItem::class);
    }

    public function save(TransactionItem $entity, bool $flush = false): void
    {
        if (!(bool)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(TransactionItem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
