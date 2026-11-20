<?php

namespace Xos\Agent;

/** Исходящий WebSocket к хабу XOS. Кадры — JSON. */
final class WsClient
{
    /** @var resource */
    private $socket;

    private string $buffer = '';

    private bool $dead = false;

    /**
     * @param resource $socket
     */
    private function __construct($socket)
    {
        $this->socket = $socket;
    }

    public static function open(Config $config, string $secret): ?self
    {
        $parts = parse_url($config->url);
        if (!is_array($parts) || !isset($parts['host'])) {
            return null;
        }
        $tls = 'https' === ($parts['scheme'] ?? '');
        $port = (int) ($parts['port'] ?? ($tls ? 443 : 80));
        $host = (string) $parts['host'];
        $remote = ($tls ? 'ssl://' : 'tcp://').$host.':'.$port;
        $context = stream_context_create($tls && '' !== $config->caFile ? ['ssl' => ['cafile' => $config->caFile, 'verify_peer' => true, 'verify_peer_name' => true]] : []);
        $socket = @stream_socket_client($remote, $errno, $error, 10, STREAM_CLIENT_CONNECT, $context);
        if (!is_resource($socket)) {
            fwrite(STDERR, 'WebSocket: '.$error."\n");

            return null;
        }
        stream_set_timeout($socket, 5);
        $key = base64_encode(random_bytes(16));
        $path = '/api/samba/agent/ws';
        $request = "GET {$path} HTTP/1.1\r\nHost: {$host}:{$port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {$key}\r\nSec-WebSocket-Version: 13\r\nAuthorization: Bearer {$secret}\r\nUser-Agent: xos-agent/1\r\n\r\n";
        fwrite($socket, $request);
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
            fwrite(STDERR, "WebSocket не принят\n");

            return null;
        }
        stream_set_blocking($socket, false);

        return new self($socket);
    }

    /**
     * @return resource
     */
    public function socket()
    {
        return $this->socket;
    }

    public function send(array $payload): bool
    {
        $text = json_encode($payload, JSON_UNESCAPED_UNICODE);
        if (!is_string($text)) {
            return false;
        }
        $written = @fwrite($this->socket, self::frame($text));

        return false !== $written && $written > 0;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function pull(): array
    {
        $chunk = fread($this->socket, 65536);
        if (false === $chunk) {
            return [];
        }
        if ('' === $chunk && feof($this->socket)) {
            return [];
        }
        $this->buffer .= $chunk;
        $messages = [];
        while (true) {
            $text = $this->take();
            if (null === $text) {
                break;
            }
            $decoded = json_decode($text, true);
            if (is_array($decoded)) {
                $messages[] = $decoded;
            }
        }

        return $messages;
    }

    public function closed(): bool
    {
        return $this->dead || !is_resource($this->socket) || feof($this->socket);
    }

    public function close(): void
    {
        if (is_resource($this->socket)) {
            fclose($this->socket);
        }
    }

    private static function frame(string $text): string
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

    private function take(): ?string
    {
        $buffer = $this->buffer;
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
        $this->buffer = substr($buffer, $offset + $length);
        if (8 === $opcode) {
            $this->dead = true;
            $this->buffer = '';

            return null;
        }

        return $data;
    }
}
