<?php

namespace IncCom\Service;

use AbstractRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\ORM\Tools\Pagination\Paginator;
use IncCom\DTO\PaginatedResponse;

/**
 * Builds paginated query results in the unified page/size format.
 */
class PaginationService
{
    public const DEFAULT_SIZE = 15;

    public const MAX_SIZE = 100;

    /**
     * Paginate a QueryBuilder or repository-backed query.
     *
     * @param QueryBuilder|AbstractRepository $source
     * @param array<string, mixed>            $filters Used when $source is a repository
     * @param array<int, array{key: string, order: string}> $sort Used when $source is a repository
     */
    public function paginate(
        QueryBuilder|AbstractRepository $source,
        int $page = 1,
        int $size = self::DEFAULT_SIZE,
        array $filters = [],
        array $sort = [],
        string $alias = 'en',
    ): PaginatedResponse {
        $page = max(1, $page);
        $size = $this->normalizeSize($size);

        $queryBuilder = $source instanceof QueryBuilder
            ? clone $source
            : $source->getQueryBuilder($filters, $sort, 0, 0, $alias);

        $queryBuilder
            ->setFirstResult(($page - 1) * $size)
            ->setMaxResults($size);

        $paginator = new Paginator($queryBuilder->getQuery(), fetchJoinCollection: true);
        $total = count($paginator);
        $pages = $size > 0 ? (int) ceil($total / $size) : 0;

        return new PaginatedResponse(
            items: iterator_to_array($paginator->getIterator()),
            total: $total,
            page: $page,
            size: $size,
            pages: $pages,
        );
    }

    /**
     * Clamp page size to allowed bounds.
     */
    public function normalizeSize(int $size): int
    {
        if ($size <= 0) {
            return self::DEFAULT_SIZE;
        }

        return min($size, self::MAX_SIZE);
    }
}
