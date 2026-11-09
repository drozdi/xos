<?php

namespace Ops\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Main\Entity\User;
use Ops\Entity\OpsLink;

/**
 * @extends ServiceEntityRepository<OpsLink>
 */
class OpsLinkRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, OpsLink::class);
    }

    /**
     * @return list<OpsLink>
     */
    public function findForUser(User $user, string $kind): array
    {
        /** @var list<OpsLink> $rows */
        $rows = $this->createQueryBuilder('l')
            ->andWhere('l.user = :user')
            ->andWhere('l.kind = :kind')
            ->setParameter('user', $user)
            ->setParameter('kind', $kind)
            ->orderBy('l.name', 'ASC')
            ->addOrderBy('l.id', 'ASC')
            ->getQuery()
            ->getResult();

        return $rows;
    }

    public function findOneForUser(User $user, string $kind, int $id): ?OpsLink
    {
        $row = $this->findOneBy(['user' => $user, 'kind' => $kind, 'id' => $id]);

        return $row instanceof OpsLink ? $row : null;
    }
}
