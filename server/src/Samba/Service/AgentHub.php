<?php

namespace Samba\Service;

use Doctrine\ORM\EntityManagerInterface;
use Samba\Entity\SambaCommand;
use Samba\Entity\SambaServer;
use Samba\Repository\SambaCommandRepository;

/** Слушает 127.0.0.1: сокеты агентов и POST /push от центра. */
final class AgentHub
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly SambaAgentService $agents,
        private readonly SambaCommandRepository $commands,
    ) {
    }

    public function listen(string $url): void
    {
        $parts = parse_url($url);
        $host = is_array($parts) && isset($parts['host']) ? (string) $parts['host'] : '127.0.0.1';
        $port = is_array($parts) && isset($parts['port']) ? (int) $parts['port'] : 8766;
        $socket = stream_socket_server('tcp://'.$host.':'.$port, $errno, $error);
        if (!is_resource($socket)) {
            throw new \RuntimeException('Хаб не слушает: '.$error);
        }
        stream_set_blocking($socket, false);
        fwrite(STDOUT, "Хаб агентов на {$host}:{$port}\n");
        /** @var array<int, array{socket: resource, buffer: string, mode: string, serverId: int}> $clients */
        $clients = [];
        $next = 1;
        while (true) {
            $read = [$socket];
            foreach ($clients as $client) {
                $read[] = $client['socket'];
            }
            $write = null;
            $except = null;
            if (false === @stream_select($read, $write, $except, 2)) {
                continue;
            }
            if (in_array($socket, $read, true)) {
                $accepted = @stream_socket_accept($socket, 0);
                if (is_resource($accepted)) {
                    stream_set_blocking($accepted, false);
                    $clients[$next] = ['socket' => $accepted, 'buffer' => '', 'mode' => 'http', 'serverId' => 0];
                    ++$next;
                }
            }
            foreach ($clients as $id => $client) {
                if (!in_array($client['socket'], $read, true)) {
                    continue;
                }
                $chunk = fread($client['socket'], 65536);
                if (!is_string($chunk) || '' === $chunk) {
                    $this->drop($clients, $id);
                    continue;
                }
                $clients[$id]['buffer'] .= $chunk;
                if ('http' === $clients[$id]['mode']) {
                    $this->http($clients, $id);
                } else {
                    $this->frames($clients, $id);
                }
            }
        }
    }

    /**
     * @param array<int, array{socket: resource, buffer: string, mode: string, serverId: int}> $clients
     */
    private function http(array &$clients, int $id): void
    {
        $buffer = $clients[$id]['buffer'];
        $split = strpos($buffer, "\r\n\r\n");
        if (false === $split) {
            return;
        }
        $head = substr($buffer, 0, $split);
        $body = substr($buffer, $split + 4);
        $lines = preg_split('/\R/', $head) ?: [];
        $request = $lines[0] ?? '';
        $length = 0;
        $bearer = '';
        $key = '';
        $upgrade = false;
        foreach ($lines as $line) {
            if (1 === preg_match('/^Content-Length:\s*(\d+)/i', $line, $match)) {
                $length = (int) $match[1];
            }
            if (1 === preg_match('/^Authorization:\s*Bearer\s+(\S+)/i', $line, $match)) {
                $bearer = $match[1];
            }
            if (1 === preg_match('/^Sec-WebSocket-Key:\s*(\S+)/i', $line, $match)) {
                $key = $match[1];
            }
            if (1 === preg_match('/^Upgrade:\s*websocket/i', $line)) {
                $upgrade = true;
            }
        }
        if (1 === preg_match('/^POST\s+\/push\s+/', $request)) {
            if (strlen($body) < $length) {
                return;
            }
            $this->push($clients[$id]['socket'], substr($body, 0, $length), $clients);
            $this->drop($clients, $id);

            return;
        }
        if ($upgrade && '' !== $key && 1 === preg_match('/^GET\s+\//', $request)) {
            $server = $this->agents->authenticate($bearer);
            if (!$server instanceof SambaServer) {
                fwrite($clients[$id]['socket'], "HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
                $this->drop($clients, $id);

                return;
            }
            foreach ($clients as $other => $row) {
                if ($other !== $id && $row['serverId'] === $server->getId()) {
                    $this->drop($clients, $other);
                }
            }
            $accept = base64_encode(sha1($key.'258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
            $reply = "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: {$accept}\r\n\r\n";
            fwrite($clients[$id]['socket'], $reply);
            $clients[$id]['mode'] = 'ws';
            $clients[$id]['serverId'] = (int) $server->getId();
            $clients[$id]['buffer'] = substr($body, $length);
            fwrite(STDOUT, "Агент сервера {$server->getId()} на сокете\n");
            $this->frames($clients, $id);

            return;
        }
        fwrite($clients[$id]['socket'], "HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
        $this->drop($clients, $id);
    }

    /**
     * @param array<int, array{socket: resource, buffer: string, mode: string, serverId: int}> $clients
     * @param resource                                                                         $socket
     */
    private function push($socket, string $body, array &$clients): void
    {
        $payload = json_decode($body, true);
        $serverId = is_array($payload) ? (int) ($payload['server_id'] ?? 0) : 0;
        $command = is_array($payload) && is_array($payload['command'] ?? null) ? $payload['command'] : null;
        $target = null;
        foreach ($clients as $client) {
            if ('ws' === $client['mode'] && $client['serverId'] === $serverId) {
                $target = $client['socket'];
                break;
            }
        }
        if (!is_resource($target) || !is_array($command)) {
            fwrite($socket, "HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");

            return;
        }
        $row = $this->commands->find((int) ($command['id'] ?? 0));
        if ($row instanceof SambaCommand && 'queued' === $row->getStatus() && $row->getServer()->getId() === $serverId) {
            $row->markDelivered();
            $this->entityManager->flush();
        }
        $text = json_encode(['kind' => 'command'] + $command, JSON_UNESCAPED_UNICODE);
        if (!is_string($text) || false === @fwrite($target, $this->frame($text))) {
            if ($row instanceof SambaCommand && 'delivered' === $row->getStatus()) {
                $row->requeue();
                $this->entityManager->flush();
            }
            fwrite($socket, "HTTP/1.1 404 Not Found\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");

            return;
        }
        fwrite($socket, "HTTP/1.1 204 No Content\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");
    }

    /**
     * @param array<int, array{socket: resource, buffer: string, mode: string, serverId: int}> $clients
     */
    private function frames(array &$clients, int $id): void
    {
        if (!isset($clients[$id])) {
            return;
        }
        while (null !== $text = $this->take($clients[$id]['buffer'])) {
            $decoded = json_decode($text, true);
            if (!is_array($decoded)) {
                continue;
            }
            $server = $this->agents->requireServer($clients[$id]['serverId']);
            $kind = (string) ($decoded['kind'] ?? '');
            try {
                if ('heartbeat' === $kind) {
                    $this->agents->heartbeat($server, $decoded);
                } elseif ('result' === $kind) {
                    $this->agents->result($server, $decoded);
                }
                $this->deliverOne($clients[$id]['socket'], $server);
            } catch (\Throwable $error) {
                fwrite(STDERR, $error->getMessage()."\n");
            }
        }
        $this->entityManager->clear();
    }

    /**
     * @param resource $socket
     */
    private function deliverOne($socket, SambaServer $server): void
    {
        $payload = null;
        $command = null;
        $this->entityManager->wrapInTransaction(function () use ($server, &$payload, &$command): void {
            $command = $this->commands->findOldestQueued($server);
            if (!$command instanceof SambaCommand) {
                return;
            }
            $command->markDelivered();
            $payload = [
                'kind' => 'command',
                'id' => $command->getId(),
                'type' => $command->getType(),
                'args' => $command->getArgs(),
                'sealed' => $command->getSealed(),
            ];
        });
        if (!is_array($payload) || !$command instanceof SambaCommand) {
            return;
        }
        $text = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if (!is_string($text) || false === @fwrite($socket, $this->frame($text))) {
            $command->requeue();
            $this->entityManager->flush();
        }
    }

    /**
     * @param array<int, array{socket: resource, buffer: string, mode: string, serverId: int}> $clients
     */
    private function drop(array &$clients, int $id): void
    {
        if (!isset($clients[$id])) {
            return;
        }
        fclose($clients[$id]['socket']);
        unset($clients[$id]);
    }

    private function frame(string $text): string
    {
        $length = strlen($text);
        $header = chr(0x81);
        if ($length < 126) {
            $header .= chr($length);
        } elseif ($length < 65536) {
            $header .= chr(126).pack('n', $length);
        } else {
            $header .= chr(127).pack('J', $length);
        }

        return $header.$text;
    }

    private function take(string &$buffer): ?string
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
        $masked = ($second & 0x80) === 0x80;
        if ($masked) {
            $offset += 4;
        }
        if (strlen($buffer) < $offset + $length) {
            return null;
        }
        $opcode = ord($buffer[0]) & 15;
        $data = substr($buffer, $offset, $length);
        if ($masked) {
            $mask = substr($buffer, $offset - 4, 4);
            $plain = '';
            for ($i = 0; $i < $length; ++$i) {
                $plain .= $data[$i] ^ $mask[$i % 4];
            }
            $data = $plain;
        }
        $buffer = substr($buffer, $offset + $length);
        if (8 === $opcode || 1 !== $opcode) {
            return 8 === $opcode ? null : $this->take($buffer);
        }

        return $data;
    }
}
