<?php

namespace Rdp\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Rdp\Entity\RdpNode;

/**
 * @extends ServiceEntityRepository<RdpNode>
 */
class RdpNodeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RdpNode::class);
    }

    public function findLocal(): ?RdpNode
    {
        $node = $this->findOneBy(['local' => true]);

        return $node instanceof RdpNode ? $node : null;
    }
}
