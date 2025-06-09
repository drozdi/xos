<?php

namespace Main\Repository;

use AbstractRepository;
use Main\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bridge\Doctrine\Security\User\UserLoaderInterface;
use Doctrine\ORM\EntityRepository;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

use Doctrine\ORM\QueryBuilder;

/**
 * @extends ServiceEntityRepository<User>
 *
 * @method User|null find($id, $lockMode = null, $lockVersion = null)
 * @method User|null findOneBy(array $criteria, array $orderBy = null)
 * @method User[]    findAll()
 * @method User[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class UserRepository extends AbstractRepository implements PasswordUpgraderInterface, UserLoaderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }
    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof User) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->getEntityManager()->persist($user);
        $this->getEntityManager()->flush();
    }


    public function save(User $entity, bool $flush = false): void
    {
        if (!(int)$entity->getId()) {
            $this->getEntityManager()->persist($entity);
        }

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(User $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
    public function loadUserByIdentifier(string $usernameOrEmail): ?User
    {
        $entityManager = $this->getEntityManager();

        return $entityManager->createQuery(
            'SELECT u
                FROM App\Entity\Main\User u
                WHERE u.login = :query
                OR u.email = :query'
        )
            ->setParameter('query', $usernameOrEmail)
            ->getOneOrNullResult();
    }
    protected function filter (QueryBuilder $query, array $filters = array(), string $n = "u"): QueryBuilder {
        if (array_key_exists('ou', $filters) && null === $filters['ou']) {
            $query->andWhere($n.'.ou IS NULL');
        } elseif (!empty($filters['ou']) && is_int($filters['ou']) && $filters['ou'] > 0) {
            $query->andWhere($this->fieldVal($n.".ou", $filters['ou']));
        } elseif (!empty($filters['ou']) && is_array($filter = $filters['ou'])) {
            $query->innerJoin($n.'.ou', $n.'ou');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."ou.{$field}", $val));
            }
        }
        if (!empty($filters['group']) && is_int($filters['group']) && $filters['group'] > 0) {
            $query->innerJoin($n.'.groups', $n.'ug');
            $query->innerJoin($n.'ug.group', $n.'g');
            $query->andWhere($this->fieldVal($n."g.id", $filters['group']));
        } elseif (!empty($filters['group']) && is_array($filter = $filters['group'])) {
            $query->innerJoin($n.'.groups', $n.'ug');
            $query->innerJoin($n.'ug.group', $n.'g');
            foreach ($filter as $field => $val) {
                $query->andWhere($this->fieldVal($n."g.{$field}", $val));
            }
        }
        return $query;
    }
    protected function order (QueryBuilder $query, array $sort = array(), string $n = "u"): QueryBuilder {
        if (count($sort) > 0) {
            foreach ($sort as $sortBy) {
                $order = strtoupper($sortBy['order'])=="DESC"? "DESC": "ASC";
                switch ($sortBy['key']) {
                    case 'ou':
                        $query->join($n.'.ou', $n.'ou')
                            ->addOrderBy($n.'ou.description', $order);
                        break;
                    case 'tutor':
                        $query->join($n.'.parent', $n.'p')
                            ->addOrderBy($n.'p.login', $order);
                        break;
                    default:
                        $query->addOrderBy($n.'.'.$sortBy['key'], $order);
                        break;
                }
            }
        }
        return $query;
    }

//    /**
//     * @return User[] Returns an array of User objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('u')
//            ->andWhere('u.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('u.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?User
//    {
//        return $this->createQueryBuilder('u')
//            ->andWhere('u.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
