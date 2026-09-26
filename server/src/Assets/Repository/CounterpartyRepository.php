<?php

namespace Assets\Repository;

use AbstractRepository;
use Assets\Entity\Counterparty;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends AbstractRepository<Counterparty>
 *
 * @method Counterparty|null find($id, $lockMode = null, $lockVersion = null)
 * @method Counterparty|null findOneBy(array $criteria, array $orderBy = null)
 * @method Counterparty[]    findAll()
 * @method Counterparty[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CounterpartyRepository extends AbstractRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Counterparty::class);
    }

    public function save(Counterparty $entity, bool $flush = false): void
    {
        if (!(int) $entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Counterparty $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
