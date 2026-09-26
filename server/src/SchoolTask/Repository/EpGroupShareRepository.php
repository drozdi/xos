<?php

namespace SchoolTask\Repository;

use AbstractRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use SchoolTask\Entity\EpGroup;
use SchoolTask\Entity\EpGroupShare;

/**
 * @extends AbstractRepository<EpGroupShare>
 */
class EpGroupShareRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EpGroupShare::class);
    }

    public function findOneByGroupAndUser(EpGroup $group, User $user): ?EpGroupShare
    {
        return $this->findOneBy(['group' => $group, 'user' => $user]);
    }

    /** @return list<EpGroupShare> */
    public function findByGroup(EpGroup $group): array
    {
        return $this->findBy(['group' => $group], ['id' => 'ASC']);
    }

    /** @return list<EpGroupShare> */
    public function findByUser(User $user): array
    {
        return $this->findBy(['user' => $user], ['id' => 'ASC']);
    }
}
