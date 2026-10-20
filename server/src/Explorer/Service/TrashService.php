<?php

namespace Explorer\Service;

use Explorer\Adapter\VolumeAdapterInterface;
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

        $items = [];
        foreach ($adapter->list(self::TRASH_FOLDER) as $item) {
            $relative = (string) ($item['relativePath'] ?? '');
            if (str_ends_with($relative, self::META_SUFFIX)) {
                continue;
            }
            $item['path'] = (new ExplorerPath($path->disk, $relative))->toUri();
            $item['disk'] = $path->disk;
            $item['trashed'] = true;
            $meta = $this->tryReadMeta($adapter, $relative);
            if (null !== $meta) {
                $item['originalPath'] = $meta['originalUri'] ?? null;
                $item['deletedAt'] = $meta['deletedAt'] ?? null;
            }
            $items[] = $item;
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
            if ('' === $relative || self::TRASH_FOLDER === $relative || str_ends_with($relative, self::META_SUFFIX)) {
                if (str_ends_with($relative, self::META_SUFFIX)) {
                    try {
                        $adapter->delete($relative);
                    } catch (\Throwable) {
                    }
                }
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
    private function writeMeta(VolumeAdapterInterface $adapter, string $trashRelative, array $data): void
    {
        $adapter->writeContents(
            $trashRelative.self::META_SUFFIX,
            json_encode($data, JSON_THROW_ON_ERROR),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function readMeta(VolumeAdapterInterface $adapter, string $trashRelative): array
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
    private function tryReadMeta(VolumeAdapterInterface $adapter, string $trashRelative): ?array
    {
        try {
            $raw = $adapter->readContents($trashRelative.self::META_SUFFIX);
        } catch (\Throwable) {
            return null;
        }

        try {
            /** @var array<string, mixed> $decoded */
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

            return $decoded;
        } catch (\JsonException) {
            return null;
        }
    }

    private function deleteMeta(VolumeAdapterInterface $adapter, string $trashRelative): void
    {
        try {
            $adapter->delete($trashRelative.self::META_SUFFIX);
        } catch (\Throwable) {
            // meta may be missing
        }
    }
}
