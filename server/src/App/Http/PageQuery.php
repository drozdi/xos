<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\Request;

/**
 * Canonical list window is page/size. Legacy limit/offset is still accepted.
 */
final class PageQuery
{
    /**
     * @return array{page: int, size: int, limit: int, offset: int}
     */
    public static function fromRequest(Request $request, int $defaultSize = 50, int $maxSize = 200): array
    {
        if ($request->query->has('page') || $request->query->has('size')) {
            $page = max(1, (int) $request->query->get('page', 1));
            $size = max(1, min($maxSize, (int) $request->query->get('size', $defaultSize)));

            return [
                'page' => $page,
                'size' => $size,
                'limit' => $size,
                'offset' => ($page - 1) * $size,
            ];
        }

        $limit = (int) $request->query->get('limit', $defaultSize);
        $offset = max(0, (int) $request->query->get('offset', 0));
        $size = $limit > 0 ? min($maxSize, $limit) : $defaultSize;
        $page = intdiv($offset, $size) + 1;

        return [
            'page' => $page,
            'size' => $size,
            'limit' => $limit,
            'offset' => $offset,
        ];
    }
}
