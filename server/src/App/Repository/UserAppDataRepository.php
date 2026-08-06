<?php

namespace App\Repository;

use App\Entity\UserAppData;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<UserAppData>
 */
class UserAppDataRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, UserAppData::class);
    }

    public function findOneByUserCode(User $user, string $code): ?UserAppData
    {
        return $this->findOneBy([
            'user' => $user,
            'code' => $code,
        ]);
    }

    /**
     * @return UserAppData[]
     */
    public function findByUser(User $user, ?string $prefix = null): array
    {
        $qb = $this->createQueryBuilder('d')
            ->andWhere('d.user = :user')
            ->setParameter('user', $user)
            ->orderBy('d.code', 'ASC');

        if (null !== $prefix && '' !== $prefix) {
            $qb
                ->andWhere('d.code LIKE :prefix')
                ->setParameter('prefix', $prefix.'%');
        }

        return $qb->getQuery()->getResult();
    }

    public function upsert(User $user, string $code, mixed $value): UserAppData
    {
        $row = $this->findOneByUserCode($user, $code);
        $now = new \DateTimeImmutable();

        if (null === $row) {
            $row = new UserAppData();
            $row->setUser($user);
            $row->setCode($code);
            $row->setCreatedAt($now);
        }

        $row->setValue($value);
        $row->setUpdatedAt($now);

        $this->getEntityManager()->persist($row);

        return $row;
    }

    public function deleteByUserCode(User $user, string $code): bool
    {
        $row = $this->findOneByUserCode($user, $code);
        if (null === $row) {
            return false;
        }

        $this->getEntityManager()->remove($row);

        return true;
    }

    public function countByUser(User $user): int
    {
        return (int) $this->createQueryBuilder('d')
            ->select('COUNT(d.id)')
            ->andWhere('d.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
