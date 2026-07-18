<?php

namespace Explorer\Service;

use Explorer\Model\ExplorerPath;
use Main\Entity\User;

final class TrashService
{
    private const TRASH_FOLDER = '.trash';
    private const META_SUFFIX = '.trashmeta';

    public function __construct(
        private readonly ExplorerPathParser $pathParser,
        private readonly DiskRegistry $diskRegistry,
    ) {
    }

    /**
     * @return array<string, mixed>
     */
    public function moveToTrash(User $user, string $uri): array
    {
        $path = $this->pathParser->parse($uri);
        if (str_starts_with($path->relativePath, self::TRASH_FOLDER)) {
            throw new \RuntimeException('Item is already in trash');
        }

        $resolved = $this->diskRegistry->resolvePath($user, $path);
        $adapter = $resolved['adapter'];

        try {
            $adapter->mkdir(self::TRASH_FOLDER);
        } catch (\Throwable) {
        }

        $baseName = '' === $path->relativePath
            ? 'root'
            : basename(str_replace('\\', '/', $path->relativePath));
        $trashName = uniqid('', true).'_'.$baseName;
        $trashRelative = self::TRASH_FOLDER.'/'.$trashName;

        $adapter->move($path->relativePath, $trashRelative, false);
        $this->writeMeta($adapter, $trashRelative, [
            'originalUri' => $uri,
            'originalRelative' => $path->relativePath,
            'disk' => $path->disk,
            'deletedAt' => gmdate('c'),
        ]);

        $entry = $adapter->info($trashRelative);
        $entry['path'] = (new ExplorerPath($path->disk, $trashRelative))->toUri();
        $entry['disk'] = $path->disk;
        $entry['trashed'] = true;
        $entry['originalPath'] = $uri;

        return $entry;
    }

    /**
     * @return array<string, mixed>
     */
    public function restore(User $user, string $trashUri): array
    {
        $path = $this->pathParser->parse($trashUri);
        if (!str_starts_with($path->relativePath, self::TRASH_FOLDER.'/')) {
            throw new \RuntimeException('Path is not in trash');
        }

        $resolved = $this->diskRegistry->resolvePath($user, $path);
        $adapter = $resolved['adapter'];
        $meta = $this->readMeta($adapter, $path->relativePath);
        $originalRelative = (string) ($meta['originalRelative'] ?? '');
        if ('' === $originalRelative) {
            throw new \RuntimeException('Trash metadata is corrupted');
        }

        $adapter->move($path->relativePath, $originalRelative, false);
        $this->deleteMeta($adapter, $path->relativePath);

        $entry = $adapter->info($originalRelative);
        $entry['path'] = (new ExplorerPath($path->disk, $originalRelative))->toUri();
        $entry['disk'] = $path->disk;

        return $entry;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listTrash(User $user, string $diskUri): array
    {
        $path = $this->pathParser->parse($diskUri);
        $resolved = $this->diskRegistry->resolvePath($user, $path);
        $adapter = $resolved['adapter'];

        try {
            $adapter->mkdir(self::TRASH_FOLDER);
        } catch (\Throwable) {
        }

        $items = $adapter->list(self::TRASH_FOLDER);
        foreach ($items as &$item) {
            $relative = (string) ($item['relativePath'] ?? '');
            $item['path'] = (new ExplorerPath($path->disk, $relative))->toUri();
            $item['disk'] = $path->disk;
            $item['trashed'] = true;
            $meta = $this->tryReadMeta($adapter, $relative);
            if (null !== $meta) {
                $item['originalPath'] = $meta['originalUri'] ?? null;
                $item['deletedAt'] = $meta['deletedAt'] ?? null;
            }
        }

        return $items;
    }

    public function emptyTrash(User $user, string $diskUri): void
    {
        $path = $this->pathParser->parse($diskUri);
        $resolved = $this->diskRegistry->resolvePath($user, $path);
        $adapter = $resolved['adapter'];

        foreach ($adapter->list(self::TRASH_FOLDER) as $item) {
            $relative = (string) ($item['relativePath'] ?? '');
            if ('' === $relative || self::TRASH_FOLDER === $relative) {
                continue;
            }
            $this->deleteMeta($adapter, $relative);
            $adapter->delete($relative);
        }
    }

    public function deletePermanent(User $user, string $trashUri): void
    {
        $path = $this->pathParser->parse($trashUri);
        if (!str_starts_with($path->relativePath, self::TRASH_FOLDER.'/')) {
            throw new \RuntimeException('Path is not in trash');
        }

        $resolved = $this->diskRegistry->resolvePath($user, $path);
        $this->deleteMeta($resolved['adapter'], $path->relativePath);
        $resolved['adapter']->delete($path->relativePath);
    }

    /**
     * @param array<string, mixed> $data
     */
    private function writeMeta(object $adapter, string $trashRelative, array $data): void
    {
        if (!method_exists($adapter, 'resolveAbsolutePath')) {
            return;
        }

        $metaRelative = $trashRelative.self::META_SUFFIX;
        /** @var \Explorer\Adapter\LocalVolumeAdapter $adapter */
        $absolute = $adapter->resolveAbsolutePath($metaRelative);
        $dir = dirname($absolute);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new \RuntimeException('Unable to write trash metadata');
        }

        file_put_contents($absolute, json_encode($data, JSON_THROW_ON_ERROR));
    }

    /**
     * @return array<string, mixed>
     */
    private function readMeta(object $adapter, string $trashRelative): array
    {
        $meta = $this->tryReadMeta($adapter, $trashRelative);
        if (null === $meta) {
            throw new \RuntimeException('Trash metadata not found');
        }

        return $meta;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function tryReadMeta(object $adapter, string $trashRelative): ?array
    {
        if (!method_exists($adapter, 'resolveAbsolutePath')) {
            return null;
        }

        /** @var \Explorer\Adapter\LocalVolumeAdapter $adapter */
        $absolute = $adapter->resolveAbsolutePath($trashRelative.self::META_SUFFIX);
        if (!is_file($absolute)) {
            return null;
        }

        /** @var array<string, mixed> $decoded */
        $decoded = json_decode((string) file_get_contents($absolute), true, 512, JSON_THROW_ON_ERROR);

        return $decoded;
    }

    private function deleteMeta(object $adapter, string $trashRelative): void
    {
        if (!method_exists($adapter, 'resolveAbsolutePath')) {
            return;
        }

        /** @var \Explorer\Adapter\LocalVolumeAdapter $adapter */
        $absolute = $adapter->resolveAbsolutePath($trashRelative.self::META_SUFFIX);
        if (is_file($absolute)) {
            unlink($absolute);
        }
    }
}
