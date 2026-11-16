<?php

namespace Samba\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Samba\Entity\SambaServer;
use Samba\Entity\SambaServerAccess;

/**
 * @extends ServiceEntityRepository<SambaServerAccess>
 */
class SambaServerAccessRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SambaServerAccess::class);
    }

    /**
     * @return list<SambaServerAccess>
     */
    public function findForServer(SambaServer $server): array
    {
        /** @var list<SambaServerAccess> $rows */
        $rows = $this->findBy(['server' => $server], ['id' => 'ASC']);

        return $rows;
    }

    public function findOneFor(SambaServer $server, User $user): ?SambaServerAccess
    {
        $row = $this->findOneBy(['server' => $server, 'user' => $user]);

        return $row instanceof SambaServerAccess ? $row : null;
    }
}
