<?php

namespace Xos\Agent;

/** Принимает одну команду от центра: POST /run, Bearer секрета агента. */
final class Listen
{
    /** @var resource|null */
    private $socket;

    private function __construct($socket)
    {
        $this->socket = $socket;
    }

    public static function open(string $listen): ?self
    {
        $listen = trim($listen);
        if ('' === $listen) {
            return null;
        }
        if (1 !== preg_match('/^[A-Za-z0-9.:-]+:\d{1,5}$/', $listen)) {
            throw new \RuntimeException('listen заполнен неверно, нужен host:port');
        }
        $socket = @stream_socket_server('tcp://'.$listen, $errno, $error);
        if (!is_resource($socket)) {
            throw new \RuntimeException('Не удалось слушать '.$listen.': '.$error);
        }
        stream_set_blocking($socket, false);

        return new self($socket);
    }

    /**
     * @return resource|null
     */
    public function socket()
    {
        return $this->socket;
    }

    public function accept(Executor $executor, string $secret): void
    {
        if (!is_resource($this->socket)) {
            return;
        }
        $client = @stream_socket_accept($this->socket, 0);
        if (!is_resource($client)) {
            return;
        }
        stream_set_blocking($client, true);
        stream_set_timeout($client, 60);
        $raw = $this->readRequest($client);
        if ($this->websocket($raw)) {
            $this->session($client, $raw, $executor, $secret);
            fclose($client);

            return;
        }
        fwrite($client, $this->handle($raw, $executor, $secret));
        fclose($client);
    }

    private function websocket(string $raw): bool
    {
        return 1 === preg_match('/^GET\s+\//', $raw) && 1 === preg_match('/^Upgrade:\s*websocket/mi', $raw);
    }

    /**
     * @param resource $client
     */
    private function session($client, string $raw, Executor $executor, string $token): void
    {
        $bearer = $this->bearer($raw);
        $key = '';
        if (1 === preg_match('/^Sec-WebSocket-Key:\s*(\S+)/mi', $raw, $match)) {
            $key = $match[1];
        }
        if ('' === $token || '' === $key || !hash_equals($token, $bearer)) {
            fwrite($client, "HTTP/1.1 401 Unauthorized\r\nConnection: close\r\nContent-Length: 0\r\n\r\n");

            return;
        }
        $accept = base64_encode(sha1($key.'258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
        fwrite($client, "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: {$accept}\r\n\r\n");
        $split = strpos($raw, "\r\n\r\n");
        $buffer = false === $split ? '' : substr($raw, $split + 4);
        $deadline = microtime(true) + 60;
        while (microtime(true) < $deadline) {
            $chunk = fread($client, 65536);
            if (is_string($chunk) && '' !== $chunk) {
                $buffer .= $chunk;
            }
            $text = $this->take($buffer);
            if (!is_string($text)) {
                $meta = stream_get_meta_data($client);
                if (!empty($meta['timed_out']) || feof($client)) {
                    break;
                }
                continue;
            }
            $payload = json_decode($text, true);
            if (!is_array($payload) || 'command' !== ($payload['kind'] ?? '')) {
                continue;
            }
            $result = $executor->run($payload);
            $reply = json_encode([
                'kind' => 'result',
                'command_id' => $payload['id'] ?? null,
                'status' => $result['status'],
                'result' => $result['result'],
            ], JSON_UNESCAPED_UNICODE);
            if (is_string($reply)) {
                fwrite($client, $this->frame($reply));
            }
            break;
        }
    }

    private function bearer(string $raw): string
    {
        if (1 === preg_match('/^Authorization:\s*Bearer\s+(\S+)/mi', $raw, $match)) {
            return $match[1];
        }

        return '';
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
        if (8 === $opcode) {
            $buffer = '';

            return null;
        }
        if (1 !== $opcode) {
            return $this->take($buffer);
        }

        return $data;
    }

    private function handle(string $raw, Executor $executor, string $secret): string
    {
        $parts = explode("\r\n\r\n", $raw, 2);
        $head = $parts[0] ?? '';
        $body = $parts[1] ?? '';
        $lines = preg_split('/\R/', $head) ?: [];
        $request = $lines[0] ?? '';
        if (1 !== preg_match('/^POST\s+\/run\s+HTTP\/1\.[01]$/', $request)) {
            return $this->reply(404, ['message' => 'Нет такого пути']);
        }
        $bearer = '';
        $length = 0;
        foreach ($lines as $line) {
            if (1 === preg_match('/^Authorization:\s*Bearer\s+(\S+)/i', $line, $match)) {
                $bearer = $match[1];
            }
            if (1 === preg_match('/^Content-Length:\s*(\d+)/i', $line, $match)) {
                $length = (int) $match[1];
            }
        }
        if ('' === $secret || !hash_equals($secret, $bearer)) {
            return $this->reply(401, ['message' => 'Секрет не подошёл']);
        }
        if (strlen($body) < $length) {
            return $this->reply(400, ['message' => 'Тело обрезано']);
        }
        $payload = json_decode(substr($body, 0, $length), true);
        if (!is_array($payload)) {
            return $this->reply(400, ['message' => 'Тело не JSON']);
        }
        $result = $executor->run($payload);

        return $this->reply(200, ['status' => $result['status'], 'result' => $result['result']]);
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function reply(int $status, array $payload): string
    {
        $text = (string) json_encode($payload, JSON_UNESCAPED_UNICODE);
        $reason = match ($status) {
            200 => 'OK',
            400 => 'Bad Request',
            401 => 'Unauthorized',
            default => 'Not Found',
        };

        return "HTTP/1.1 {$status} {$reason}\r\nContent-Type: application/json\r\nContent-Length: ".strlen($text)."\r\nConnection: close\r\n\r\n".$text;
    }

    /**
     * @param resource $client
     */
    private function readRequest($client): string
    {
        $raw = '';
        while (!str_contains($raw, "\r\n\r\n") && strlen($raw) < 1_000_000) {
            $chunk = fread($client, 8192);
            if (!is_string($chunk) || '' === $chunk) {
                break;
            }
            $raw .= $chunk;
        }
        $length = 0;
        if (1 === preg_match('/Content-Length:\s*(\d+)/i', $raw, $match)) {
            $length = (int) $match[1];
        }
        $split = strpos($raw, "\r\n\r\n");
        $have = false === $split ? 0 : strlen($raw) - $split - 4;
        while ($have < $length && strlen($raw) < 5_000_000) {
            $chunk = fread($client, 8192);
            if (!is_string($chunk) || '' === $chunk) {
                break;
            }
            $raw .= $chunk;
            $have += strlen($chunk);
        }

        return $raw;
    }
}
