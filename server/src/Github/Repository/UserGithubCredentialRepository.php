<?php

namespace Github\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Github\Entity\UserGithubCredential;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<UserGithubCredential>
 */
class UserGithubCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserGithubCredential::class);
    }

    public function findOneByUser(User $user): ?UserGithubCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
