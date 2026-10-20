<?php

namespace Explorer\Service;

/**
 * Low-level HTTP calls to Yandex Disk REST API (cloud-api.yandex.net/v1/).
 *
 * @see https://yandex.ru/dev/disk-api/doc/ru/
 */
class YandexDiskApiClient
{
    private const API_BASE = 'https://cloud-api.yandex.net/v1';
    private const POLL_INTERVAL_US = 200_000;
    private const POLL_MAX_ATTEMPTS = 50;

    public function __construct(
        private readonly string $accessToken,
    ) {
        if ('' === trim($accessToken)) {
            throw new \InvalidArgumentException('Yandex Disk access token is empty');
        }
    }

    /**
     * @param array<string, scalar|null>|null $query
     * @param array<string, mixed>|null       $jsonBody
     *
     * @return array{status: int, data: mixed, headers: list<string>}
     */
    public function request(string $method, string $path, ?array $query = null, ?array $jsonBody = null): array
    {
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
                $url .= '?'.http_build_query($filtered);
            }
        }

        $headers = [
            'Authorization: OAuth '.$this->accessToken,
            'Accept: application/json',
            'User-Agent: XOS-Explorer-YandexDisk/1.0',
        ];
        $content = null;
        if (null !== $jsonBody) {
            $headers[] = 'Content-Type: application/json';
            $content = json_encode($jsonBody, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        }

        return $this->rawRequest(strtoupper($method), $url, $headers, $content);
    }

    /**
     * Wait until an async Disk operation finishes (HTTP 202 + href).
     *
     * @param array<string, mixed> $operationPayload
     */
    public function awaitOperation(array $operationPayload): void
    {
        $href = (string) ($operationPayload['href'] ?? '');
        if ('' === $href) {
            return;
        }

        for ($i = 0; $i < self::POLL_MAX_ATTEMPTS; ++$i) {
            $result = $this->rawRequest('GET', $href, [
                'Authorization: OAuth '.$this->accessToken,
                'Accept: application/json',
                'User-Agent: XOS-Explorer-YandexDisk/1.0',
            ], null);
            $status = is_array($result['data']) ? (string) ($result['data']['status'] ?? '') : '';
            if ('success' === $status) {
                return;
            }
            if ('failed' === $status) {
                throw new \RuntimeException('Yandex Disk operation failed');
            }
            usleep(self::POLL_INTERVAL_US);
        }

        throw new \RuntimeException('Yandex Disk operation timed out');
    }

    /**
     * @return resource
     */
    public function openUrlStream(string $url)
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", [
                    'Authorization: OAuth '.$this->accessToken,
                    'User-Agent: XOS-Explorer-YandexDisk/1.0',
                ]),
                'timeout' => 120,
                'ignore_errors' => true,
                'follow_location' => 1,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $handle = @fopen($url, 'rb', false, $context);
        if (false === $handle) {
            $err = error_get_last();
            throw new \RuntimeException('Unable to open download stream: '.($err['message'] ?? 'unknown'));
        }

        return $handle;
    }

    public function putBinary(string $url, string $binary): void
    {
        $headers = [
            'Authorization: OAuth '.$this->accessToken,
            'Content-Type: application/octet-stream',
            'Content-Length: '.strlen($binary),
            'User-Agent: XOS-Explorer-YandexDisk/1.0',
        ];
        $result = $this->rawRequest('PUT', $url, $headers, $binary, false);
        if ($result['status'] < 200 || $result['status'] >= 300) {
            throw new \RuntimeException('Yandex Disk upload failed with HTTP '.$result['status']);
        }
    }

    public function putFile(string $url, string $localPath): void
    {
        $size = filesize($localPath);
        if (false === $size) {
            throw new \RuntimeException('Unable to read upload file size');
        }
        $handle = fopen($localPath, 'rb');
        if (false === $handle) {
            throw new \RuntimeException('Unable to open upload file');
        }

        try {
            $headers = [
                'Authorization: OAuth '.$this->accessToken,
                'Content-Type: application/octet-stream',
                'Content-Length: '.$size,
                'User-Agent: XOS-Explorer-YandexDisk/1.0',
            ];
            $result = $this->rawRequest('PUT', $url, $headers, $handle, false);
            if ($result['status'] < 200 || $result['status'] >= 300) {
                throw new \RuntimeException('Yandex Disk upload failed with HTTP '.$result['status']);
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param list<string>           $headers
     * @param string|resource|null   $content
     *
     * @return array{status: int, data: mixed, headers: list<string>}
     */
    private function rawRequest(string $method, string $url, array $headers, mixed $content, bool $decodeJson = true): array
    {
        $http = [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'timeout' => 60,
            'ignore_errors' => true,
            'follow_location' => 0,
        ];
        if (null !== $content) {
            $http['content'] = $content;
        }

        $context = stream_context_create([
            'http' => $http,
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $raw = @file_get_contents($url, false, $context);
        /** @var list<string> $responseHeaders */
        $responseHeaders = $http_response_header ?? [];
        $status = $this->extractHttpStatus($responseHeaders) ?? 0;

        if (0 === $status && false === $raw) {
            $err = error_get_last();
            throw new \RuntimeException('Сеть: '.($err['message'] ?? 'нет ответа от Yandex Disk'));
        }

        $decoded = null;
        if ($decodeJson && is_string($raw) && '' !== $raw) {
            try {
                $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            } catch (\JsonException) {
                $decoded = null;
            }
        }

        if ($status >= 400) {
            $message = is_array($decoded) && isset($decoded['message']) && is_string($decoded['message'])
                ? $decoded['message']
                : 'Yandex Disk ответил HTTP '.$status;
            throw new \RuntimeException($message, $status);
        }

        return ['status' => $status, 'data' => $decoded, 'headers' => $responseHeaders];
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
