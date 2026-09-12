<?php

namespace IncCom\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use IncCom\Entity\UserFnsCredential;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<UserFnsCredential>
 */
class UserFnsCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserFnsCredential::class);
    }

    public function findOneByUser(User $user): ?UserFnsCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
