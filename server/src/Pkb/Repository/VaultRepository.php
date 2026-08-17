<?php

namespace Pkb\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Pkb\Entity\Vault;

/**
 * @extends ServiceEntityRepository<Vault>
 */
class VaultRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Vault::class);
    }

    /** @return list<Vault> */
    public function findByOwner(User $user): array
    {
        return $this->createQueryBuilder('v')
            ->andWhere('v.owner = :owner')
            ->setParameter('owner', $user)
            ->orderBy('v.updatedAt', 'DESC')
            ->addOrderBy('v.id', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function findOneByOwnerAndSlug(User $user, string $slug): ?Vault
    {
        return $this->findOneBy(['owner' => $user, 'slug' => $slug]);
    }

    /** @return list<Vault> */
    public function findAccessibleByUser(User $user): array
    {
        return $this->createQueryBuilder('v')
            ->leftJoin('v.members', 'm')
            ->andWhere('v.owner = :user OR m.user = :user')
            ->setParameter('user', $user)
            ->orderBy('v.updatedAt', 'DESC')
            ->addOrderBy('v.id', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
