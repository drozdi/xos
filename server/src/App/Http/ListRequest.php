<?php

namespace App\Http;

/**
 * Normalizes POST list/select payloads that historically used limit=-1.
 * Clamps page size to the ListQuery range (1–100).
 */
final class ListRequest
{
    /**
     * @param array<string, mixed> $defaults
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public static function merge(array $defaults, array $payload): array
    {
        $req = array_merge($defaults, $payload);
        if (isset($defaults['filters']) && is_array($defaults['filters'])) {
            $filters = $payload['filters'] ?? [];
            $req['filters'] = array_merge(
                $defaults['filters'],
                is_array($filters) ? $filters : [],
            );
        }

        if (array_key_exists('size', $payload) && !array_key_exists('limit', $payload)) {
            $req['limit'] = (int) $payload['size'];
        }

        $limit = (int) ($req['limit'] ?? 20);
        if ($limit < 1) {
            $limit = 20;
        }
        $req['limit'] = max(1, min(100, $limit));
        $req['offset'] = max(1, (int) ($req['offset'] ?? 1));

        return $req;
    }
}
