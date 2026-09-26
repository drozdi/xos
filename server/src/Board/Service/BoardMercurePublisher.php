<?php

namespace Board\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;

/**
 * Optional Mercure hub publisher. When MERCURE_URL + MERCURE_JWT_SECRET are set,
 * board mutations publish to topic `https://xos/boards/{id}` (SSE remains fallback).
 */
final class BoardMercurePublisher
{
    public function __construct(
        #[Autowire('%env(default::MERCURE_URL)%')]
        private readonly ?string $hubUrl = null,
        #[Autowire('%env(default::MERCURE_JWT_SECRET)%')]
        private readonly ?string $jwtSecret = null,
    ) {
    }

    public function isEnabled(): bool
    {
        return null !== $this->hubUrl && '' !== trim((string) $this->hubUrl)
            && null !== $this->jwtSecret && '' !== trim((string) $this->jwtSecret);
    }

    public function hubUrl(): ?string
    {
        return $this->isEnabled() ? rtrim(trim((string) $this->hubUrl), '/') : null;
    }

    public function topicForBoard(int $boardId): string
    {
        return 'https://xos/boards/'.$boardId;
    }

    /** Subscriber JWT for EventSource (authorize query param). */
    public function subscriberToken(int $boardId, int $ttlSeconds = 3600): ?string
    {
        if (!$this->isEnabled()) {
            return null;
        }

        return $this->signJwt([
            'mercure' => [
                'subscribe' => [$this->topicForBoard($boardId)],
            ],
            'exp' => time() + max(60, $ttlSeconds),
        ]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    public function publishBoard(int $boardId, array $payload = []): void
    {
        if (!$this->isEnabled()) {
            return;
        }

        $topic = $this->topicForBoard($boardId);
        $data = json_encode($payload + [
            'board_id' => $boardId,
            'server_time' => (new \DateTimeImmutable())->format('Y-m-d H:i:s'),
        ], \JSON_UNESCAPED_UNICODE);
        if (false === $data) {
            return;
        }

        $body = http_build_query([
            'topic' => $topic,
            'data' => $data,
            'private' => 'on',
        ]);

        $token = $this->signJwt([
            'mercure' => [
                'publish' => [$topic],
            ],
            'exp' => time() + 300,
        ]);

        $url = $this->hubUrl().'/.well-known/mercure';
        $ctx = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => implode("\r\n", [
                    'Content-Type: application/x-www-form-urlencoded',
                    'Authorization: Bearer '.$token,
                    'Content-Length: '.strlen($body),
                ]),
                'content' => $body,
                'timeout' => 2,
                'ignore_errors' => true,
            ],
        ]);
        @file_get_contents($url, false, $ctx);
    }

    /** @param array<string, mixed> $payload */
    private function signJwt(array $payload): string
    {
        $header = $this->b64(['alg' => 'HS256', 'typ' => 'JWT']);
        $body = $this->b64($payload);
        $sig = hash_hmac('sha256', $header.'.'.$body, (string) $this->jwtSecret, true);

        return $header.'.'.$body.'.'.$this->b64raw($sig);
    }

    /** @param array<string, mixed> $data */
    private function b64(array $data): string
    {
        return $this->b64raw(json_encode($data, \JSON_UNESCAPED_UNICODE) ?: '{}');
    }

    private function b64raw(string $raw): string
    {
        return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    }
}
