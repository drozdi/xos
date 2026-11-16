<?php

namespace Xos\Agent;

final class Credentials
{
    public function __construct(
        public readonly int $serverId,
        public readonly string $secret,
    ) {
    }

    public static function load(string $dir): ?self
    {
        $path = rtrim($dir, '/\\').'/credentials';
        if (!is_file($path)) {
            return null;
        }
        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded) || !isset($decoded['secret'], $decoded['server_id'])) {
            return null;
        }

        return new self((int) $decoded['server_id'], (string) $decoded['secret']);
    }

    public function save(string $dir): void
    {
        if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new \RuntimeException('Не удалось создать '.$dir);
        }
        $path = rtrim($dir, '/\\').'/credentials';
        $written = file_put_contents($path, json_encode([
            'server_id' => $this->serverId,
            'secret' => $this->secret,
        ], JSON_THROW_ON_ERROR));
        if (false === $written) {
            throw new \RuntimeException('Не удалось записать учётные данные');
        }
        @chmod($path, 0600);
    }
}
