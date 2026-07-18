<?php

namespace Explorer\Repository;

use AbstractRepository;
use Explorer\Entity\UserDisk;
use Main\Entity\User;

/** @extends AbstractRepository<UserDisk> */
class UserDiskRepository extends AbstractRepository
{
    public function __construct(\Doctrine\Persistence\ManagerRegistry $registry)
    {
        parent::__construct($registry, UserDisk::class);
    }

    /**
     * @return list<UserDisk>
     */
    public function findByOwner(User $user): array
    {
        return $this->createQueryBuilder('d')
            ->andWhere('d.owner = :owner')
            ->setParameter('owner', $user)
            ->orderBy('d.sort', 'ASC')
            ->addOrderBy('d.label', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function save(UserDisk $entity, bool $flush = false): void
    {
        if (!(bool) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(UserDisk $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
