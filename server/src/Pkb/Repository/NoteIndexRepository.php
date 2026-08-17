<?php



namespace Pkb\Repository;



use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;

use Doctrine\Persistence\ManagerRegistry;

use Pkb\Entity\NoteIndex;

use Pkb\Entity\Vault;



/**

 * @extends ServiceEntityRepository<NoteIndex>

 */

class NoteIndexRepository extends ServiceEntityRepository

{

    public function __construct(ManagerRegistry $registry)

    {

        parent::__construct($registry, NoteIndex::class);

    }



    public function findOneByVaultAndPath(Vault $vault, string $path): ?NoteIndex

    {

        return $this->findOneBy(['vault' => $vault, 'path' => $path]);

    }



    /** @return list<NoteIndex> */

    public function findByVault(Vault $vault): array

    {

        return $this->createQueryBuilder('n')

            ->andWhere('n.vault = :vault')

            ->setParameter('vault', $vault)

            ->orderBy('n.path', 'ASC')

            ->getQuery()

            ->getResult();

    }



    /** @return list<NoteIndex> */

    public function findByVaultAndTitle(Vault $vault, string $title, bool $caseSensitive = false): array

    {

        $qb = $this->createQueryBuilder('n')

            ->andWhere('n.vault = :vault')

            ->setParameter('vault', $vault);



        if ($caseSensitive) {

            $qb->andWhere('n.title = :title')

                ->setParameter('title', $title);

        } else {

            $qb->andWhere('LOWER(n.title) = LOWER(:title)')

                ->setParameter('title', $title);

        }



        return $qb->orderBy('n.path', 'ASC')

            ->getQuery()

            ->getResult();

    }



    /** @return list<NoteIndex> */

    public function findByVaultPathEndingWith(Vault $vault, string $filename, bool $caseSensitive = false): array

    {

        $qb = $this->createQueryBuilder('n')

            ->andWhere('n.vault = :vault')

            ->setParameter('vault', $vault);



        if ($caseSensitive) {

            $qb->andWhere('n.path LIKE :suffix')

                ->setParameter('suffix', '%/'.$filename);

        } else {

            $qb->andWhere('LOWER(n.path) LIKE LOWER(:suffix)')

                ->setParameter('suffix', '%/'.$filename);

        }



        return $qb->orderBy('n.path', 'ASC')

            ->getQuery()

            ->getResult();

    }



    /** @return list<NoteIndex> */

    public function searchByVault(Vault $vault, string $query, int $limit = 50): array

    {

        return $this->createQueryBuilder('n')

            ->andWhere('n.vault = :vault')

            ->andWhere('LOWER(n.title) LIKE LOWER(:query) OR LOWER(n.bodyExcerpt) LIKE LOWER(:query)')

            ->setParameter('vault', $vault)

            ->setParameter('query', '%'.$query.'%')

            ->orderBy('n.title', 'ASC')

            ->setMaxResults($limit)

            ->getQuery()

            ->getResult();

    }



    public function countByVault(Vault $vault): int

    {

        return (int) $this->createQueryBuilder('n')

            ->select('COUNT(n.id)')

            ->andWhere('n.vault = :vault')

            ->setParameter('vault', $vault)

            ->getQuery()

            ->getSingleScalarResult();

    }



    public function findLatestIndexedAt(Vault $vault): ?\DateTimeInterface

    {

        $result = $this->createQueryBuilder('n')

            ->select('MAX(n.indexedAt)')

            ->andWhere('n.vault = :vault')

            ->setParameter('vault', $vault)

            ->getQuery()

            ->getSingleScalarResult();



        if (null === $result) {

            return null;

        }



        return new \DateTime((string) $result);

    }



    public function deleteByVaultAndPath(Vault $vault, string $path): int

    {

        return $this->createQueryBuilder('n')

            ->delete()

            ->andWhere('n.vault = :vault')

            ->andWhere('n.path = :path')

            ->setParameter('vault', $vault)

            ->setParameter('path', $path)

            ->getQuery()

            ->execute();

    }

}

