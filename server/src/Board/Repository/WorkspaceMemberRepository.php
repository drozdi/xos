<?php

namespace Board\Repository;

use Board\Entity\Workspace;
use Board\Entity\WorkspaceMember;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<WorkspaceMember>
 */
class WorkspaceMemberRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, WorkspaceMember::class);
    }

    public function findOneByWorkspaceAndUser(Workspace $workspace, User $user): ?WorkspaceMember
    {
        return $this->findOneBy([
            'workspace' => $workspace,
            'user' => $user,
        ]);
    }
}
