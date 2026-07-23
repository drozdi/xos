<?php

namespace Todo\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Todo\Entity\TodoListShare;

/**
 * @extends ServiceEntityRepository<TodoListShare>
 */
class TodoListShareRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, TodoListShare::class);
    }
}
