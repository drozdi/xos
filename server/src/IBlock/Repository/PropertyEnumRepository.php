<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\Property\Enum as PropertyEnum;

/**
 * @extends AbstractRepository<PropertyEnum>
 */
class PropertyEnumRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PropertyEnum::class);
    }

    public function save(PropertyEnum $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PropertyEnum $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
