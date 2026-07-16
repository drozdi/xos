<?php

namespace App\Http;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

final class ApiResponse
{
    public static function forbidden(string $message): JsonResponse
    {
        return new JsonResponse(['message' => $message], Response::HTTP_FORBIDDEN);
    }

    public static function notFound(string $message): JsonResponse
    {
        return new JsonResponse(['message' => $message], Response::HTTP_NOT_FOUND);
    }
}
