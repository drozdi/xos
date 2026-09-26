<?php

namespace Inbox\Repository;

use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Inbox\Entity\Message;
use Main\Entity\User;

/**
 * @extends ServiceEntityRepository<Message>
 */
class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    /**
     * @return list<Message>
     */
    public function findInboxFor(User $user, int $limit = 100): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.toUser = :user')
            ->setParameter('user', $user)
            ->orderBy('m.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return list<Message>
     */
    public function findSentFor(User $user, int $limit = 100): array
    {
        return $this->createQueryBuilder('m')
            ->andWhere('m.fromUser = :user')
            ->setParameter('user', $user)
            ->orderBy('m.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
