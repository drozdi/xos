<?php

namespace IncCom\DTO;

/**
 * Unified paginated list response (page/size format per API spec).
 */
class PaginatedResponse
{
    /**
     * @param array<int, mixed> $items
     */
    public function __construct(
        public readonly array $items,
        public readonly int $total,
        public readonly int $page,
        public readonly int $size,
        public readonly int $pages,
    ) {
    }

    /**
     * @return array{items: array<int, mixed>, total: int, page: int, size: int, pages: int}
     */
    public function toArray(): array
    {
        return [
            'items' => $this->items,
            'total' => $this->total,
            'page' => $this->page,
            'size' => $this->size,
            'pages' => $this->pages,
        ];
    }
}
