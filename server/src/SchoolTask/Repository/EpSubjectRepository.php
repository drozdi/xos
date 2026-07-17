<?php

namespace SchoolTask\Repository;

use AbstractRepository;
use Doctrine\Persistence\ManagerRegistry;
use SchoolTask\Entity\EpSubject;

/**
 * @extends AbstractRepository<EpSubject>
 */
class EpSubjectRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EpSubject::class);
    }

    public function save(EpSubject $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(EpSubject $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
