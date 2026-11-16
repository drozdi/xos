<?php

namespace Rdp\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Rdp\Entity\RdpNetworkGrant;

/**
 * @extends ServiceEntityRepository<RdpNetworkGrant>
 */
class RdpNetworkGrantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RdpNetworkGrant::class);
    }
}
