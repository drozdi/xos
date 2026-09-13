<?php

namespace Ts\Service;

use Main\Entity\User;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Ts\Repository\UserTsCredentialRepository;

/**
 * Low-level HTTP calls to TeamStorm CWM public API using stored credentials.
 */
final class TsApiClient
{
    public function __construct(
        private readonly UserTsCredentialRepository $credentialRepository,
        private readonly TsTokenCipher $tokenCipher,
    ) {
    }

    /**
     * @param array<string, scalar|null>|null $query
     * @param array<string, mixed>|null       $body
     *
     * @return array{status: int, data: mixed}
     */
    public function request(User $user, string $method, string $path, ?array $query = null, ?array $body = null): array
    {
        $credential = $this->credentialRepository->findOneByUser($user);
        if (null === $credential
            || '' === trim($credential->getBaseUrl())
            || '' === trim($credential->getPrivateToken())
        ) {
            throw new BadRequestHttpException('Сначала сохраните URL и PrivateToken');
        }

        $baseUrl = rtrim($credential->getBaseUrl(), '/');
        $token = $this->tokenCipher->decrypt($credential->getPrivateToken());
        $path = '/'.ltrim($path, '/');
        if (!str_starts_with($path, '/cwm/')) {
            $path = '/cwm/public/api/v1'.$path;
        }
        $url = $baseUrl.$path;
        if (null !== $query && $query !== []) {
            $filtered = [];
            foreach ($query as $key => $value) {
                if (null !== $value && '' !== $value) {
                    $filtered[$key] = $value;
                }
            }
            if ($filtered !== []) {
                $url .= (str_contains($url, '?') ? '&' : '?').http_build_query($filtered);
            }
        }

        $headers = [
            'Authorization: PrivateToken '.$token,
            'Accept: application/json',
            'User-Agent: XOS-TeamStorm/1.0',
        ];
        $content = null;
        if (null !== $body) {
            $headers[] = 'Content-Type: application/json';
            $content = json_encode($body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }

        $context = stream_context_create([
            'http' => [
                'method' => strtoupper($method),
                'header' => implode("\r\n", $headers),
                'content' => $content,
                'timeout' => 30,
                'ignore_errors' => true,
                'follow_location' => 0,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $raw = @file_get_contents($url, false, $context);
        $status = $this->extractHttpStatus($http_response_header ?? []);

        if (null === $status && false === $raw) {
            $err = error_get_last();
            throw new HttpException(502, 'Сеть: '.($err['message'] ?? 'нет ответа от TeamStorm'));
        }

        $status ??= 0;
        $decoded = null;
        if (is_string($raw) && '' !== $raw) {
            try {
                $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                $decoded = null;
            }
        }

        if ($status >= 200 && $status < 300) {
            return ['status' => $status, 'data' => $decoded];
        }

        if (401 === $status || 403 === $status) {
            throw new HttpException($status, 'Неверный или недостаточно привилегированный PrivateToken');
        }

        $message = is_array($decoded) && isset($decoded['message']) && is_string($decoded['message'])
            ? $decoded['message']
            : 'TeamStorm ответил HTTP '.$status;

        throw new HttpException($status >= 400 && $status < 600 ? $status : 502, $message);
    }

    /**
     * @param list<string> $headers
     */
    private function extractHttpStatus(array $headers): ?int
    {
        foreach ($headers as $line) {
            if (preg_match('#^HTTP/\S+\s+(\d{3})#', $line, $m)) {
                return (int) $m[1];
            }
        }

        return null;
    }
}
