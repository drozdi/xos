<?php

namespace Github\Service;

use Github\Repository\UserGithubCredentialRepository;
use Main\Entity\User;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Low-level HTTP calls to GitHub REST API using stored credentials.
 */
final class GithubApiClient
{
    private const API_BASE = 'https://api.github.com';

    public function __construct(
        private readonly UserGithubCredentialRepository $credentialRepository,
        private readonly GithubTokenCipher $tokenCipher,
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
        if (null === $credential || '' === trim($credential->getAccessToken())) {
            throw new BadRequestHttpException('Сначала сохраните GitHub Personal Access Token');
        }

        $token = $this->tokenCipher->decrypt($credential->getAccessToken());
        $path = '/'.ltrim($path, '/');
        $url = self::API_BASE.$path;
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
            'Authorization: Bearer '.$token,
            'Accept: application/vnd.github+json',
            'X-GitHub-Api-Version: 2022-11-28',
            'User-Agent: XOS-GitHub/1.0',
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
            throw new HttpException(502, 'Сеть: '.($err['message'] ?? 'нет ответа от GitHub'));
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
            throw new HttpException($status, 'Неверный или недостаточно привилегированный GitHub token');
        }

        $message = is_array($decoded) && isset($decoded['message']) && is_string($decoded['message'])
            ? $decoded['message']
            : 'GitHub ответил HTTP '.$status;

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
