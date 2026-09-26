<?php

namespace Assets\Repository;

use AbstractRepository;
use Assets\Entity\WarehouseItem;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<WarehouseItem>
 *
 * @method WarehouseItem|null find($id, $lockMode = null, $lockVersion = null)
 * @method WarehouseItem|null findOneBy(array $criteria, array $orderBy = null)
 * @method WarehouseItem[]    findAll()
 * @method WarehouseItem[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class WarehouseItemRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WarehouseItem::class);
    }

    public function save(WarehouseItem $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(WarehouseItem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
