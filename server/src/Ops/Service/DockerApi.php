<?php

namespace Ops\Service;

use Ops\Entity\OpsLink;
use Ssh\Service\SshSecretCipher;
use Symfony\Component\HttpClient\HttpClient;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Contracts\HttpClient\Exception\ExceptionInterface;
use Symfony\Contracts\HttpClient\HttpClientInterface;

final class DockerApi
{
    private readonly HttpClientInterface $http;

    public function __construct(private readonly SshSecretCipher $cipher)
    {
        $this->http = HttpClient::create([
            'timeout' => 8,
            'max_redirects' => 0,
        ]);
    }

    /**
     * @return list<array{id: string, name: string, image: string, state: string, status: string}>
     */
    public function containers(OpsLink $link): array
    {
        $payload = $this->json($link, 'GET', '/containers/json?all=1');
        if (!\is_array($payload)) {
            throw new BadRequestHttpException('Docker не отдал список');
        }
        $rows = [];
        foreach ($payload as $item) {
            if (!\is_array($item)) {
                continue;
            }
            $id = isset($item['Id']) && \is_string($item['Id']) ? $item['Id'] : '';
            if (1 !== preg_match('/^[a-fA-F0-9]{12,64}$/', $id)) {
                continue;
            }
            $names = $item['Names'] ?? [];
            $name = \is_array($names) && isset($names[0]) && \is_string($names[0]) ? ltrim($names[0], '/') : $id;
            $rows[] = [
                'id' => $id,
                'name' => $name,
                'image' => isset($item['Image']) && \is_string($item['Image']) ? $item['Image'] : '',
                'state' => isset($item['State']) && \is_string($item['State']) ? $item['State'] : '',
                'status' => isset($item['Status']) && \is_string($item['Status']) ? $item['Status'] : '',
            ];
            if (\count($rows) >= 100) {
                break;
            }
        }

        return $rows;
    }

    public function action(OpsLink $link, string $id, string $action): void
    {
        $this->assertId($id);
        if ('start' !== $action && 'stop' !== $action) {
            throw new BadRequestHttpException('Действие недоступно');
        }
        $this->send($link, 'POST', '/containers/'.$id.'/'.$action);
    }

    public function logs(OpsLink $link, string $id): string
    {
        $this->assertId($id);
        $raw = $this->send($link, 'GET', '/containers/'.$id.'/logs?stdout=1&stderr=1&tail=200');
        if (strlen($raw) > 200_000) {
            $raw = substr($raw, -200_000);
        }

        return $this->demux($raw);
    }

    private function assertId(string $id): void
    {
        if (1 !== preg_match('/^[a-fA-F0-9]{12,64}$/', $id)) {
            throw new BadRequestHttpException('Контейнер не указан');
        }
    }

    private function json(OpsLink $link, string $method, string $path): mixed
    {
        $raw = $this->send($link, $method, $path);
        try {
            return json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new BadRequestHttpException('Docker прислал неразборчивый ответ');
        }
    }

    private function send(OpsLink $link, string $method, string $path): string
    {
        $headers = ['Accept' => 'application/json'];
        if ('' !== $link->getSecret()) {
            $headers['Authorization'] = 'Bearer '.$this->cipher->decrypt($link->getSecret());
        }
        try {
            $response = $this->http->request($method, $link->getHost().'/v1.41'.$path, [
                'headers' => $headers,
            ]);
            $status = $response->getStatusCode();
            $body = $response->getContent(false);
        } catch (ExceptionInterface $error) {
            throw new BadRequestHttpException('Docker недоступен');
        }
        if ($status < 200 || $status >= 300) {
            throw new BadRequestHttpException($this->failure($status, $body));
        }

        return $body;
    }

    private function failure(int $status, string $body): string
    {
        try {
            $decoded = json_decode($body, true, 8, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            $decoded = null;
        }
        $message = \is_array($decoded) && isset($decoded['message']) && \is_string($decoded['message'])
            ? trim($decoded['message'])
            : '';
        if ('' === $message || strlen($message) > 200) {
            return 'Docker ответил '.$status;
        }

        return $message;
    }

    private function demux(string $raw): string
    {
        if (strlen($raw) < 8) {
            return $raw;
        }
        $text = '';
        $offset = 0;
        $length = strlen($raw);
        while ($offset + 8 <= $length) {
            $stream = ord($raw[$offset]);
            if ($stream < 1 || $stream > 2) {
                return $raw;
            }
            $size = unpack('N', substr($raw, $offset + 4, 4));
            $bytes = \is_array($size) ? (int) $size[1] : 0;
            if ($bytes < 0 || $offset + 8 + $bytes > $length) {
                return $raw;
            }
            $text .= substr($raw, $offset + 8, $bytes);
            $offset += 8 + $bytes;
        }

        return $offset === $length ? $text : $raw;
    }
}
