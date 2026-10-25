<?php

namespace Ssh\Service;

use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SshSessionStore
{
    public function __construct(
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    /**
     * @return array{id: string, user_id: int, connection_id: int, columns: int, rows: int}
     */
    public function create(int $userId, int $connectionId, int $columns, int $rows): array
    {
        $this->purgeExpired();
        $id = bin2hex(random_bytes(16));
        $dir = $this->dir($id);
        if (!mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new \RuntimeException('Не удалось создать сессию SSH');
        }
        $meta = [
            'id' => $id,
            'user_id' => $userId,
            'connection_id' => $connectionId,
            'columns' => $columns,
            'rows' => $rows,
        ];
        $this->writeMeta($id, $meta);
        file_put_contents($dir.'/input', '');

        return $meta;
    }

    /**
     * @return array{id: string, user_id: int, connection_id: int, columns: int, rows: int}
     */
    public function requireForUser(int $userId, string $sessionId): array
    {
        $meta = $this->readMeta($sessionId);
        if (null === $meta || $meta['user_id'] !== $userId) {
            throw new NotFoundHttpException('Сессия не найдена');
        }

        return $meta;
    }

    public function appendInput(int $userId, string $sessionId, string $data): void
    {
        $this->requireForUser($userId, $sessionId);
        if ($this->isClosed($sessionId)) {
            throw new NotFoundHttpException('Сессия закрыта');
        }
        if (strlen($data) > 32_000) {
            throw new \InvalidArgumentException('Слишком большой ввод');
        }
        $path = $this->dir($sessionId).'/input';
        $handle = fopen($path, 'ab');
        if (false === $handle) {
            throw new \RuntimeException('Не удалось записать ввод');
        }
        try {
            if (!flock($handle, LOCK_EX)) {
                throw new \RuntimeException('Не удалось записать ввод');
            }
            $size = fstat($handle);
            if (is_array($size) && ($size['size'] ?? 0) > 1_000_000) {
                throw new \InvalidArgumentException('Буфер ввода переполнен');
            }
            fwrite($handle, $data);
            fflush($handle);
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    public function consumeInput(string $sessionId): string
    {
        $path = $this->dir($sessionId).'/input';
        if (!is_file($path)) {
            return '';
        }
        $handle = fopen($path, 'c+b');
        if (false === $handle) {
            return '';
        }
        try {
            if (!flock($handle, LOCK_EX)) {
                return '';
            }
            $data = stream_get_contents($handle);
            ftruncate($handle, 0);
            rewind($handle);

            return is_string($data) ? $data : '';
        } finally {
            flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    public function close(int $userId, string $sessionId): void
    {
        $this->requireForUser($userId, $sessionId);
        file_put_contents($this->dir($sessionId).'/closed', '1');
    }

    public function isClosed(string $sessionId): bool
    {
        return is_file($this->dir($sessionId).'/closed');
    }

    public function destroy(string $sessionId): void
    {
        $dir = $this->dir($sessionId);
        if (!is_dir($dir)) {
            return;
        }
        foreach (['input', 'closed', 'meta.json'] as $name) {
            $path = $dir.'/'.$name;
            if (is_file($path)) {
                unlink($path);
            }
        }
        rmdir($dir);
    }

    /**
     * @return array{id: string, user_id: int, connection_id: int, columns: int, rows: int}|null
     */
    private function readMeta(string $sessionId): ?array
    {
        if (1 !== preg_match('/^[a-f0-9]{32}$/', $sessionId)) {
            return null;
        }
        $path = $this->dir($sessionId).'/meta.json';
        if (!is_file($path)) {
            return null;
        }
        try {
            $decoded = json_decode((string) file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }
        if (!is_array($decoded)) {
            return null;
        }
        $userId = $decoded['user_id'] ?? null;
        $connectionId = $decoded['connection_id'] ?? null;
        if (!is_int($userId) || !is_int($connectionId)) {
            return null;
        }

        return [
            'id' => $sessionId,
            'user_id' => $userId,
            'connection_id' => $connectionId,
            'columns' => is_int($decoded['columns'] ?? null) ? $decoded['columns'] : 80,
            'rows' => is_int($decoded['rows'] ?? null) ? $decoded['rows'] : 24,
        ];
    }

    /**
     * @param array{id: string, user_id: int, connection_id: int, columns: int, rows: int} $meta
     */
    private function writeMeta(string $sessionId, array $meta): void
    {
        file_put_contents(
            $this->dir($sessionId).'/meta.json',
            json_encode($meta, JSON_THROW_ON_ERROR),
        );
    }

    private function dir(string $sessionId): string
    {
        if (1 !== preg_match('/^[a-f0-9]{32}$/', $sessionId)) {
            throw new NotFoundHttpException('Сессия не найдена');
        }

        return $this->projectDir.'/var/ssh-sessions/'.$sessionId;
    }

    private function purgeExpired(): void
    {
        $root = $this->projectDir.'/var/ssh-sessions';
        if (!is_dir($root)) {
            return;
        }
        $limit = time() - 7200;
        foreach (scandir($root) ?: [] as $name) {
            if (1 !== preg_match('/^[a-f0-9]{32}$/', $name)) {
                continue;
            }
            $dir = $root.'/'.$name;
            $mtime = filemtime($dir);
            if (false !== $mtime && $mtime < $limit) {
                $this->destroy($name);
            }
        }
    }
}
