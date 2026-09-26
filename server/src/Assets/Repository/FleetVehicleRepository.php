<?php

namespace Assets\Repository;

use AbstractRepository;
use Assets\Entity\FleetVehicle;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<FleetVehicle>
 *
 * @method FleetVehicle|null find($id, $lockMode = null, $lockVersion = null)
 * @method FleetVehicle|null findOneBy(array $criteria, array $orderBy = null)
 * @method FleetVehicle[]    findAll()
 * @method FleetVehicle[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class FleetVehicleRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, FleetVehicle::class);
    }

    public function save(FleetVehicle $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(FleetVehicle $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
