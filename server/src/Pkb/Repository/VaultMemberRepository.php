<?php

namespace Pkb\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Pkb\Entity\Vault;
use Pkb\Entity\VaultMember;

/**
 * @extends ServiceEntityRepository<VaultMember>
 */
class VaultMemberRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, VaultMember::class);
    }

    public function findOneByVaultAndUser(Vault $vault, User $user): ?VaultMember
    {
        return $this->findOneBy(['vault' => $vault, 'user' => $user]);
    }
}
