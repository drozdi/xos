<?php

namespace Board\Repository;

use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\Card;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Card>
 */
class CardRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Card::class);
    }

    /** @return list<Card> */
    public function findByListOrdered(BoardList $list): array
    {
        return $this->createQueryBuilder('c')
            ->andWhere('c.list = :list')
            ->setParameter('list', $list)
            ->orderBy('c.position', 'ASC')
            ->addOrderBy('c.id', 'ASC')
            ->getQuery()
            ->getResult();
    }

    public function getMaxPosition(BoardList $list): ?int
    {
        $result = $this->createQueryBuilder('c')
            ->select('MAX(c.position)')
            ->andWhere('c.list = :list')
            ->setParameter('list', $list)
            ->getQuery()
            ->getSingleScalarResult();

        return null !== $result ? (int) $result : null;
    }

    /**
     * @param array{
     *     assignee_ids?: list<int>,
     *     label_ids?: list<int>,
     *     due_before?: ?\DateTimeInterface,
     *     due_after?: ?\DateTimeInterface,
     *     q?: string
     * } $filters
     *
     * @return list<int>
     */
    public function findMatchingIdsForBoard(Board $board, array $filters): array
    {
        $qb = $this->createQueryBuilder('c')
            ->select('DISTINCT c.id')
            ->innerJoin('c.list', 'l')
            ->andWhere('l.board = :board')
            ->andWhere('c.archivedAt IS NULL')
            ->setParameter('board', $board);

        $assigneeIds = $filters['assignee_ids'] ?? [];
        if ([] !== $assigneeIds) {
            $qb->innerJoin('c.assignees', 'assigneeFilter')
                ->andWhere('assigneeFilter.id IN (:assigneeIds)')
                ->setParameter('assigneeIds', $assigneeIds);
        }

        $labelIds = $filters['label_ids'] ?? [];
        if ([] !== $labelIds) {
            $qb->innerJoin('c.labels', 'labelFilter')
                ->andWhere('labelFilter.id IN (:labelIds)')
                ->setParameter('labelIds', $labelIds);
        }

        if (isset($filters['due_before']) && $filters['due_before'] instanceof \DateTimeInterface) {
            $qb->andWhere('c.dueDate <= :dueBefore')
                ->setParameter('dueBefore', $filters['due_before']);
        }

        if (isset($filters['due_after']) && $filters['due_after'] instanceof \DateTimeInterface) {
            $qb->andWhere('c.dueDate >= :dueAfter')
                ->setParameter('dueAfter', $filters['due_after']);
        }

        $q = trim((string) ($filters['q'] ?? ''));
        if ('' !== $q) {
            $qb->andWhere('c.title LIKE :search OR c.descriptionMd LIKE :search')
                ->setParameter('search', '%'.$q.'%');
        }

        /** @var list<array{id: int|string}> $rows */
        $rows = $qb->getQuery()->getScalarResult();

        return array_map(static fn (array $row): int => (int) $row['id'], $rows);
    }

    /** @return list<Card> */
    public function findDueInRangeForUser(User $user, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        return $this->createQueryBuilder('c')
            ->distinct()
            ->innerJoin('c.list', 'l')
            ->innerJoin('l.board', 'b')
            ->innerJoin('b.workspace', 'w')
            ->leftJoin('w.members', 'wm', 'WITH', 'wm.user = :user')
            ->leftJoin('b.members', 'bm', 'WITH', 'bm.user = :user')
            ->andWhere('c.archivedAt IS NULL')
            ->andWhere('c.dueDate IS NOT NULL')
            ->andWhere('c.dueDate >= :start')
            ->andWhere('c.dueDate <= :end')
            ->andWhere('w.owner = :user OR wm.user IS NOT NULL OR bm.user IS NOT NULL')
            ->setParameter('user', $user)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('c.dueDate', 'ASC')
            ->addOrderBy('c.id', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
