<?php

namespace Board\Repository;

use Board\Entity\Workspace;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<Workspace>
 */
class WorkspaceRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Workspace::class);
    }

    /** @return list<Workspace> */
    public function findAccessibleForUser(User $user): array
    {
        return $this->createQueryBuilder('w')
            ->leftJoin('w.members', 'm')
            ->andWhere('w.owner = :user OR m.user = :user')
            ->setParameter('user', $user)
            ->orderBy('w.updatedAt', 'DESC')
            ->addOrderBy('w.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
