<?php

namespace SchoolTask\Repository;

use AbstractRepository;
use SchoolTask\Entity\EpGroup;

/**
 * @extends AbstractRepository<EpGroup>
 */
class EpGroupRepository extends AbstractRepository
{
    public function __construct(\Doctrine\Persistence\ManagerRegistry $registry)
    {
        parent::__construct($registry, EpGroup::class);
    }

    public function save(EpGroup $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(EpGroup $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
