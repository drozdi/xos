<?php

namespace Assets\Repository;

use AbstractRepository;
use Assets\Entity\SoftPackage;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<SoftPackage>
 *
 * @method SoftPackage|null find($id, $lockMode = null, $lockVersion = null)
 * @method SoftPackage|null findOneBy(array $criteria, array $orderBy = null)
 * @method SoftPackage[]    findAll()
 * @method SoftPackage[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class SoftPackageRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SoftPackage::class);
    }

    public function save(SoftPackage $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(SoftPackage $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
