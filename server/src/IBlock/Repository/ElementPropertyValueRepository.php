<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\ElementPropertyValue;

/**
 * @extends AbstractRepository<ElementPropertyValue>
 */
class ElementPropertyValueRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ElementPropertyValue::class);
    }

    public function save(ElementPropertyValue $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(ElementPropertyValue $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /** @return list<ElementPropertyValue> */
    public function findByElement(int $elementId): array
    {
        return $this->findBy(['element' => $elementId]);
    }
}
