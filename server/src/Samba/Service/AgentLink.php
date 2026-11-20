<?php

namespace Samba\Service;

use Doctrine\ORM\EntityManagerInterface;
use Samba\Entity\SambaCommand;
use Symfony\Component\DependencyInjection\Attribute\Autowire;

/** Доставляет команду сразу: WebSocket агента по токену установки, иначе толчок в хаб. */
final class AgentLink
{
    public function __construct(
        private readonly SambaAgentService $agents,
        private readonly EntityManagerInterface $entityManager,
        #[Autowire('%env(default::SAMBA_AGENT_HUB)%')]
        private readonly ?string $hubUrl = null,
    ) {
    }

    public function nudge(SambaCommand $command): void
    {
        $url = trim((string) $command->getServer()->getAgentUrl());
        if ('' !== $url) {
            $this->dial($command, $url);

            return;
        }
        $this->push($command);
    }

    private function dial(SambaCommand $command, string $url): void
    {
        $token = trim((string) $command->getServer()->getAgentToken());
        if ('' === $token) {
            return;
        }
        $command->markRunning();
        $this->entityManager->flush();
        try {
            $response = $this->socket($url, $token, [
                'id' => $command->getId(),
                'type' => $command->getType(),
                'args' => $command->getArgs(),
                'sealed' => $command->getSealed(),
            ], 55);
            $status = (string) ($response['status'] ?? '');
            if (!in_array($status, ['succeeded', 'failed', 'rejected'], true)) {
                throw new \RuntimeException('Ответ агента без статуса');
            }
            $this->agents->result($command->getServer(), [
                'command_id' => $command->getId(),
                'status' => $status,
                'result' => (string) ($response['result'] ?? ''),
            ]);
        } catch (\Throwable) {
            if ('running' === $command->getStatus()) {
                $command->requeue();
                $this->entityManager->flush();
            }
        }
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array<string, mixed>
     */
    private function socket(string $url, string $token, array $command, int $timeout): array
    {
        $parts = parse_url($url);
        if (!is_array($parts) || !isset($parts['host'], $parts['port'])) {
            throw new \RuntimeException('Адрес агента заполнен неверно');
        }
        $tls = 'https' === ($parts['scheme'] ?? '');
        $host = (string) $parts['host'];
        $port = (int) $parts['port'];
        $remote = ($tls ? 'ssl://' : 'tcp://').$host.':'.$port;
        $context = stream_context_create($tls ? ['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]] : []);
        $socket = @stream_socket_client($remote, $errno, $error, 10, STREAM_CLIENT_CONNECT, $context);
        if (!is_resource($socket)) {
            throw new \RuntimeException('Сеть: '.$error);
        }
        stream_set_timeout($socket, $timeout);
        $key = base64_encode(random_bytes(16));
        fwrite($socket, "GET / HTTP/1.1\r\nHost: {$host}:{$port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {$key}\r\nSec-WebSocket-Version: 13\r\nAuthorization: Bearer {$token}\r\nUser-Agent: xos-center/1\r\n\r\n");
        $head = '';
        while (!str_contains($head, "\r\n\r\n") && strlen($head) < 8192) {
            $chunk = fread($socket, 1024);
            if (!is_string($chunk) || '' === $chunk) {
                break;
            }
            $head .= $chunk;
        }
        $accept = base64_encode(sha1($key.'258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
        if (!str_contains($head, '101') || !str_contains($head, $accept)) {
            fclose($socket);
            throw new \RuntimeException('Агент не принял WebSocket');
        }
        $text = json_encode(['kind' => 'command'] + $command, JSON_UNESCAPED_UNICODE);
        if (!is_string($text) || false === fwrite($socket, $this->clientFrame($text))) {
            fclose($socket);
            throw new \RuntimeException('Команда не ушла');
        }
        $buffer = '';
        $deadline = microtime(true) + $timeout;
        while (microtime(true) < $deadline) {
            $chunk = fread($socket, 65536);
            if (is_string($chunk) && '' !== $chunk) {
                $buffer .= $chunk;
            }
            $frame = $this->takeFrame($buffer);
            if (is_string($frame)) {
                fclose($socket);
                $decoded = json_decode($frame, true);

                return is_array($decoded) ? $decoded : [];
            }
            $meta = stream_get_meta_data($socket);
            if (!empty($meta['timed_out']) || feof($socket)) {
                break;
            }
        }
        fclose($socket);
        throw new \RuntimeException('Агент не ответил');
    }

    private function clientFrame(string $text): string
    {
        $length = strlen($text);
        $mask = random_bytes(4);
        $header = chr(0x81);
        if ($length < 126) {
            $header .= chr(0x80 | $length);
        } elseif ($length < 65536) {
            $header .= chr(0x80 | 126).pack('n', $length);
        } else {
            $header .= chr(0x80 | 127).pack('J', $length);
        }
        $header .= $mask;
        $masked = '';
        for ($i = 0; $i < $length; ++$i) {
            $masked .= $text[$i] ^ $mask[$i % 4];
        }

        return $header.$masked;
    }

    private function takeFrame(string &$buffer): ?string
    {
        if (strlen($buffer) < 2) {
            return null;
        }
        $second = ord($buffer[1]);
        $length = $second & 127;
        $offset = 2;
        if (126 === $length) {
            if (strlen($buffer) < 4) {
                return null;
            }
            $length = unpack('n', substr($buffer, 2, 2))[1];
            $offset = 4;
        } elseif (127 === $length) {
            if (strlen($buffer) < 10) {
                return null;
            }
            $length = unpack('J', substr($buffer, 2, 8))[1];
            $offset = 10;
        }
        if (strlen($buffer) < $offset + $length) {
            return null;
        }
        $data = substr($buffer, $offset, $length);
        $buffer = substr($buffer, $offset + $length);

        return $data;
    }

    private function push(SambaCommand $command): void
    {
        $hub = trim((string) $this->hubUrl);
        if ('' === $hub) {
            return;
        }
        try {
            $this->post(rtrim($hub, '/').'/push', null, [
                'server_id' => $command->getServer()->getId(),
                'command' => [
                    'id' => $command->getId(),
                    'type' => $command->getType(),
                    'args' => $command->getArgs(),
                    'sealed' => $command->getSealed(),
                ],
            ], 2);
        } catch (\Throwable) {
        }
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    private function post(string $url, ?string $bearer, array $body, int $timeout): array
    {
        if (!function_exists('curl_init')) {
            throw new \RuntimeException('Нужно расширение curl');
        }
        $curl = curl_init($url);
        if (false === $curl) {
            throw new \RuntimeException('Не удалось открыть запрос');
        }
        $headers = ['Accept: application/json', 'Content-Type: application/json', 'User-Agent: xos-center/1'];
        if (null !== $bearer) {
            $headers[] = 'Authorization: Bearer '.$bearer;
        }
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => json_encode($body, JSON_THROW_ON_ERROR),
        ]);
        $raw = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $error = curl_error($curl);
        curl_close($curl);
        if (!is_string($raw)) {
            throw new \RuntimeException('Сеть: '.$error);
        }
        if ($status < 200 || $status >= 300) {
            throw new \RuntimeException('Ответ '.$status);
        }
        if ('' === $raw) {
            return [];
        }
        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }
}
