<?php

namespace Ts\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Ts\Entity\UserTsCredential;

/**
 * @extends ServiceEntityRepository<UserTsCredential>
 */
class UserTsCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserTsCredential::class);
    }

    public function findOneByUser(User $user): ?UserTsCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
