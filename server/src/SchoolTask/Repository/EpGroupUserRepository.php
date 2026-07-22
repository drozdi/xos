<?php

namespace SchoolTask\Repository;

use AbstractRepository;
use SchoolTask\Entity\EpGroupUser;

/**
 * @extends AbstractRepository<EpGroupUser>
 */
class EpGroupUserRepository extends AbstractRepository
{
    public function __construct(\Doctrine\Persistence\ManagerRegistry $registry)
    {
        parent::__construct($registry, EpGroupUser::class);
    }

    public function save(EpGroupUser $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(EpGroupUser $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
