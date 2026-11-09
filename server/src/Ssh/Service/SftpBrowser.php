<?php

namespace Ssh\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use phpseclib3\Net\SFTP;
use Ssh\Entity\SshConnection;
use Ssh\Repository\SshConnectionRepository;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class SftpBrowser
{
    private const MAX_BYTES = 20_971_520;

    public function __construct(
        private readonly SshConnectionRepository $connections,
        private readonly SshClient $client,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{path: string, entries: list<array{name: string, dir: bool, size: int, mtime: int}>}
     */
    public function list(User $user, int $connectionId, string $path, bool $acceptHostKey): array
    {
        return $this->with($user, $connectionId, $acceptHostKey, function (SFTP $sftp) use ($path): array {
            $dir = $this->path($path);
            $listed = $sftp->rawlist($dir);
            if (!\is_array($listed)) {
                $this->fail($sftp, 'Каталог недоступен');
            }
            $shown = $sftp->pwd();
            if (('.' === $dir || '' === $dir) && \is_string($shown) && '' !== $shown) {
                $dir = $shown;
            }
            $entries = [];
            foreach ($listed as $name => $attrs) {
                if (!\is_string($name) || '.' === $name || str_contains($name, '/') || str_contains($name, "\0")) {
                    continue;
                }
                if ('..' === $name && ('/' === $dir || '' === $dir)) {
                    continue;
                }
                if (!\is_array($attrs)) {
                    continue;
                }
                $entries[] = [
                    'name' => $name,
                    'dir' => 2 === (int) ($attrs['type'] ?? 0),
                    'size' => (int) ($attrs['size'] ?? 0),
                    'mtime' => (int) ($attrs['mtime'] ?? 0),
                ];
                if (\count($entries) >= 500) {
                    break;
                }
            }
            usort($entries, static function (array $left, array $right): int {
                if ($left['dir'] !== $right['dir']) {
                    return $left['dir'] ? -1 : 1;
                }

                return strnatcasecmp($left['name'], $right['name']);
            });

            return ['path' => $dir, 'entries' => $entries];
        });
    }

    public function download(User $user, int $connectionId, string $path, bool $acceptHostKey): string
    {
        return $this->with($user, $connectionId, $acceptHostKey, function (SFTP $sftp) use ($path): string {
            $file = $this->path($path);
            $stat = $sftp->stat($file);
            if (!\is_array($stat) || 2 === (int) ($stat['type'] ?? 0)) {
                throw new BadRequestHttpException('Файл недоступен');
            }
            $size = (int) ($stat['size'] ?? 0);
            if ($size < 0 || $size > self::MAX_BYTES) {
                throw new BadRequestHttpException('Файл больше 20 МБ');
            }
            $body = $sftp->get($file);
            if (!\is_string($body)) {
                $this->fail($sftp, 'Файл недоступен');
            }

            return $body;
        });
    }

    public function upload(User $user, int $connectionId, string $directory, UploadedFile $file, bool $acceptHostKey): void
    {
        if (!$file->isValid()) {
            throw new BadRequestHttpException('Файл не загружен');
        }
        $size = $file->getSize();
        if (!\is_int($size) || $size < 0 || $size > self::MAX_BYTES) {
            throw new BadRequestHttpException('Файл больше 20 МБ');
        }
        $name = $this->leaf($file->getClientOriginalName());
        $this->with($user, $connectionId, $acceptHostKey, function (SFTP $sftp) use ($directory, $name, $file): bool {
            $dir = $this->path($directory);
            $target = $this->join($dir, $name);
            $body = file_get_contents($file->getPathname());
            if (!\is_string($body)) {
                throw new BadRequestHttpException('Файл не загружен');
            }
            if (!$sftp->put($target, $body)) {
                $this->fail($sftp, 'Не удалось загрузить файл');
            }

            return true;
        });
    }

    public function mkdir(User $user, int $connectionId, string $directory, string $name, bool $acceptHostKey): void
    {
        $leaf = $this->leaf($name);
        $this->with($user, $connectionId, $acceptHostKey, function (SFTP $sftp) use ($directory, $leaf): bool {
            if (!$sftp->mkdir($this->join($this->path($directory), $leaf))) {
                $this->fail($sftp, 'Не удалось создать каталог');
            }

            return true;
        });
    }

    public function remove(User $user, int $connectionId, string $path, bool $acceptHostKey): void
    {
        $this->with($user, $connectionId, $acceptHostKey, function (SFTP $sftp) use ($path): bool {
            $file = $this->path($path);
            if ('/' === $file || '.' === $file || '' === $file) {
                throw new BadRequestHttpException('Этот путь удалять нельзя');
            }
            $stat = $sftp->stat($file);
            $directory = \is_array($stat) && 2 === (int) ($stat['type'] ?? 0);
            $ok = $directory ? $sftp->rmdir($file) : $sftp->delete($file);
            if (!$ok) {
                $this->fail($sftp, 'Не удалось удалить');
            }

            return true;
        });
    }

    public function rename(User $user, int $connectionId, string $path, string $name, bool $acceptHostKey): void
    {
        $leaf = $this->leaf($name);
        $this->with($user, $connectionId, $acceptHostKey, function (SFTP $sftp) use ($path, $leaf): bool {
            $file = $this->path($path);
            if (!$sftp->rename($file, $this->join($this->parent($file), $leaf))) {
                $this->fail($sftp, 'Не удалось переименовать');
            }

            return true;
        });
    }

    /**
     * @template T
     *
     * @param callable(SFTP): T $fn
     *
     * @return T
     */
    private function with(User $user, int $connectionId, bool $acceptHostKey, callable $fn): mixed
    {
        $connection = $this->connections->findOneForUser($user, $connectionId);
        if (!$connection instanceof SshConnection) {
            throw new NotFoundHttpException('Подключение не найдено');
        }
        $sftp = $this->client->openSftp($connection, $acceptHostKey);
        try {
            $fingerprint = SshClient::fingerprint((string) $sftp->getServerPublicHostKey());
            if ($connection->getHostKeyFingerprint() !== $fingerprint) {
                $connection->setHostKeyFingerprint($fingerprint);
                $this->entityManager->flush();
            }

            return $fn($sftp);
        } finally {
            try {
                $sftp->disconnect();
            } catch (\Throwable) {
            }
        }
    }

    private function path(string $value): string
    {
        $path = trim($value);
        if ('' === $path) {
            return '.';
        }
        if (strlen($path) > 1024 || str_contains($path, "\0") || 1 === preg_match('/[\r\n]/', $path)) {
            throw new BadRequestHttpException('Путь заполнен неверно');
        }

        return $path;
    }

    private function leaf(string $name): string
    {
        $leaf = basename(str_replace('\\', '/', trim($name)));
        if ('' === $leaf || '.' === $leaf || '..' === $leaf || strlen($leaf) > 240 || str_contains($leaf, '/') || str_contains($leaf, "\0")) {
            throw new BadRequestHttpException('Имя заполнено неверно');
        }

        return $leaf;
    }

    private function join(string $directory, string $name): string
    {
        if ('/' === $directory || '' === $directory || '.' === $directory) {
            return '/'.$name;
        }

        return rtrim($directory, '/').'/'.$name;
    }

    private function parent(string $path): string
    {
        $trim = rtrim(str_replace('\\', '/', $path), '/');
        if ('' === $trim || '/' === $trim) {
            return '/';
        }
        $pos = strrpos($trim, '/');
        if (false === $pos || 0 === $pos) {
            return '/';
        }

        return substr($trim, 0, $pos);
    }

    private function fail(SFTP $sftp, string $fallback): never
    {
        $error = trim($sftp->getLastSFTPError());
        if ('' === $error || strlen($error) > 200) {
            throw new BadRequestHttpException($fallback);
        }

        throw new BadRequestHttpException($fallback.': '.$error);
    }
}
