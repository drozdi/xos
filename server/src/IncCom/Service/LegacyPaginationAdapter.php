<?php

namespace IncCom\Service;

use IncCom\DTO\PaginatedResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * Adapts legacy limit/offset pagination to the unified page/size format.
 */
class LegacyPaginationAdapter
{
    public function __construct(
        private readonly PaginationService $paginationService,
    ) {
    }

    /**
     * Whether the request uses the new page/size pagination format.
     */
    public function usesNewFormat(Request $request): bool
    {
        return $request->query->has('page') || $request->query->has('size');
    }

    /**
     * @return array{limit: int, offset: int}
     */
    public function getLegacyParams(Request $request): array
    {
        return [
            'limit' => (int) $request->query->get('limit', -1),
            'offset' => (int) $request->query->get('offset', 0),
        ];
    }

    /**
     * @return array{page: int, size: int}
     */
    public function getNewParams(Request $request): array
    {
        return [
            'page' => max(1, (int) $request->query->get('page', 1)),
            'size' => $this->paginationService->normalizeSize(
                (int) $request->query->get('size', PaginationService::DEFAULT_SIZE),
            ),
        ];
    }

    /**
     * Build legacy list response body (limit/offset format).
     *
     * @param array<int, mixed> $items
     *
     * @return array{body: array<string, mixed>, headers: array<string, string>}
     */
    public function buildLegacyResponse(array $items, int $totalItems, int $limit, int $offset): array
    {
        $start = $limit * ($offset - 1);
        $end = ($limit > 0 ? $limit * $offset : $totalItems) - 1;
        $end = $end > $totalItems - 1 ? $totalItems - 1 : $end;
        $pageTotal = $limit > 0 ? (int) ($totalItems / $limit) : 0;

        return [
            'body' => [
                'items' => $items,
                'countItems' => count($items),
                'totalItems' => $totalItems,
                'limit' => $limit,
                'offset' => $offset,
                'next' => $offset + 1,
                'prev' => $offset - 1,
                'total' => $pageTotal,
            ],
            'headers' => [
                'Content-Range' => sprintf('items %d-%d/%d', $start, $end, $totalItems),
                'Content-Page' => sprintf('page %d/%d', $offset, $pageTotal),
            ],
        ];
    }

    /**
     * Build unified page/size list response body.
     *
     * @param array<int, mixed> $mappedItems
     *
     * @return array<string, mixed>
     */
    public function buildNewResponse(PaginatedResponse $paginated, array $mappedItems): array
    {
        return [
            'items' => $mappedItems,
            'total' => $paginated->total,
            'page' => $paginated->page,
            'size' => $paginated->size,
            'pages' => $paginated->pages,
        ];
    }
}
