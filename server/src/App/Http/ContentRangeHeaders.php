<?php

namespace App\Http;

final class ContentRangeHeaders
{
    /**
     * @return array<string, string>
     */
    public static function forLegacyPagination(int $limit, int $offset, int $totalItems): array
    {
        $start = $limit * ($offset - 1);
        $end = ($limit > 0 ? $limit * $offset : $totalItems) - 1;
        $end = $end > $totalItems - 1 ? $totalItems - 1 : $end;

        return [
            'Content-Range' => sprintf('items %d-%d/%d', max(0, $start), max(0, $end), $totalItems),
        ];
    }
}
