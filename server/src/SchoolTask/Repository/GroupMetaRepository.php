<?php

namespace SchoolTask\Repository;

use AbstractRepository;
use Doctrine\Persistence\ManagerRegistry;
use SchoolTask\Entity\GroupMeta;

/**
 * @extends AbstractRepository<GroupMeta>
 */
class GroupMetaRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, GroupMeta::class);
    }

    public function save(GroupMeta $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(GroupMeta $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
