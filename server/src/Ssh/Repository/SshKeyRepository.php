<?php

namespace Ssh\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Ssh\Entity\SshKey;

/**
 * @extends ServiceEntityRepository<SshKey>
 */
class SshKeyRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, SshKey::class);
    }

    /**
     * @return list<SshKey>
     */
    public function findForUser(User $user): array
    {
        /** @var list<SshKey> $rows */
        $rows = $this->createQueryBuilder('k')
            ->andWhere('k.user = :user')
            ->setParameter('user', $user)
            ->orderBy('k.name', 'ASC')
            ->addOrderBy('k.id', 'ASC')
            ->getQuery()
            ->getResult();

        return $rows;
    }

    public function findOneForUser(User $user, int $id): ?SshKey
    {
        $row = $this->findOneBy(['user' => $user, 'id' => $id]);

        return $row instanceof SshKey ? $row : null;
    }
}
