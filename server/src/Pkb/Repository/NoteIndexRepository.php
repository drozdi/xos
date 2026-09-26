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
    private const FULLTEXT_MIN_LENGTH = 3;

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
        $query = trim($query);
        if ('' === $query) {
            return [];
        }

        $limit = max(1, min(200, $limit));

        if (mb_strlen($query) < self::FULLTEXT_MIN_LENGTH) {
            return $this->searchByVaultLike($vault, $query, $limit);
        }

        try {
            $results = $this->searchByVaultFulltext($vault, $query, $limit);
            if ([] !== $results) {
                return $results;
            }

            // BOOLEAN MODE can miss substrings — fall back to LIKE when empty.
            return $this->searchByVaultLike($vault, $query, $limit);
        } catch (\Throwable) {
            return $this->searchByVaultLike($vault, $query, $limit);
        }
    }

    /** @return list<NoteIndex> */
    private function searchByVaultFulltext(Vault $vault, string $query, int $limit): array
    {
        $vaultId = $vault->getId();
        if (null === $vaultId) {
            return [];
        }

        $booleanQuery = $this->toBooleanQuery($query);
        if ('' === $booleanQuery) {
            return $this->searchByVaultLike($vault, $query, $limit);
        }

        $conn = $this->getEntityManager()->getConnection();
        $ids = $conn->fetchFirstColumn(
            'SELECT n.id
             FROM pkb_note_index n
             WHERE n.vault_id = :vault_id
               AND MATCH(n.title, n.body_excerpt) AGAINST (:q IN BOOLEAN MODE)
             ORDER BY n.title ASC
             LIMIT '.$limit,
            [
                'vault_id' => $vaultId,
                'q' => $booleanQuery,
            ],
        );

        if ([] === $ids) {
            return [];
        }

        /** @var list<NoteIndex> $notes */
        $notes = $this->createQueryBuilder('n')
            ->andWhere('n.id IN (:ids)')
            ->setParameter('ids', array_map(static fn ($id): int => (int) $id, $ids))
            ->orderBy('n.title', 'ASC')
            ->getQuery()
            ->getResult();

        return $notes;
    }

    /** @return list<NoteIndex> */
    private function searchByVaultLike(Vault $vault, string $query, int $limit): array
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

    private function toBooleanQuery(string $query): string
    {
        $cleaned = preg_replace('/[+\-><()~*\"@\\\\]+/u', ' ', $query) ?? $query;
        $terms = preg_split('/\s+/u', trim($cleaned), -1, PREG_SPLIT_NO_EMPTY) ?: [];
        if ([] === $terms) {
            return '';
        }

        return implode(' ', array_map(
            static fn (string $term): string => '+'.$term.'*',
            $terms,
        ));
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
