<?php

namespace IBlock\Repository;

use AbstractRepository;
use Doctrine\Persistence\ManagerRegistry;
use IBlock\Entity\ElementShare;

/**
 * @extends AbstractRepository<ElementShare>
 */
class ElementShareRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ElementShare::class);
    }
}
