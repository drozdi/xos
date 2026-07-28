<?php

namespace Explorer\Service;

use Explorer\Model\ExplorerPath;
use Main\Entity\User;
use Symfony\Component\Filesystem\Filesystem;

final class ExplorerManager
{
    private readonly Filesystem $filesystem;

    public function __construct(
        private readonly ExplorerPathParser $pathParser,
        private readonly DiskRegistry $diskRegistry,
        private readonly FileTypeRegistry $fileTypeRegistry,
        private readonly TrashService $trashService,
    ) {
        $this->filesystem = new Filesystem();
    }

    /**
     * @return array<string, mixed>
     */
    public function getConfig(User $user): array
    {
        return [
            'disks' => $this->diskRegistry->listDisks($user),
            'fileTypes' => $this->fileTypeRegistry->allTypes(),
            'openWith' => $this->fileTypeRegistry->allOpenWith(),
            'sortOptions' => ['name', 'size', 'type'],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function list(User $user, string $uri, string $sortBy = 'name', string $sortDir = 'asc'): array
    {
        $resolved = $this->resolve($user, $uri);

        return $resolved['adapter']->list($resolved['relativePath'], $sortBy, $sortDir);
    }

    /**
     * @return array<string, mixed>
     */
    public function info(User $user, string $uri): array
    {
        $resolved = $this->resolve($user, $uri);

        return $this->withUri($resolved, $resolved['adapter']->info($resolved['relativePath']));
    }

    /**
     * @return array<string, mixed>
     */
    public function tree(User $user, string $uri, int $depth = 2): array
    {
        $resolved = $this->resolve($user, $uri);

        return $this->withUri($resolved, $resolved['adapter']->tree($resolved['relativePath'], $depth));
    }

    public function mkdir(User $user, string $uri): array
    {
        $resolved = $this->resolve($user, $uri);
        $resolved['adapter']->mkdir($resolved['relativePath']);

        return $this->info($user, $uri);
    }

    public function rename(User $user, string $fromUri, string $newName): array
    {
        $from = $this->pathParser->parse($fromUri);
        $parent = dirname(str_replace('\\', '/', $from->relativePath));
        $parent = ('.' === $parent) ? '' : $parent;
        $toRelative = '' === $parent ? $newName : $parent.'/'.$newName;
        $to = new ExplorerPath($from->disk, $this->pathParser->normalizeRelativePath($toRelative));

        $resolved = $this->resolve($user, $from->toUri());
        $resolved['adapter']->rename($from->relativePath, $to->relativePath);

        return $this->info($user, $to->toUri());
    }

    public function copy(User $user, string $fromUri, string $toUri, bool $overwrite = false): array
    {
        $from = $this->resolve($user, $fromUri);
        $to = $this->resolve($user, $toUri);

        if ($from['disk'] === $to['disk']) {
            $from['adapter']->copy($from['relativePath'], $to['relativePath'], $overwrite);
        } else {
            $this->transferAcrossDisks($from, $to, $overwrite, false);
        }

        return $this->info($user, $toUri);
    }

    public function move(User $user, string $fromUri, string $toUri, bool $overwrite = false): array
    {
        $from = $this->resolve($user, $fromUri);
        $to = $this->resolve($user, $toUri);

        if ($from['disk'] === $to['disk']) {
            $from['adapter']->move($from['relativePath'], $to['relativePath'], $overwrite);
        } else {
            $this->transferAcrossDisks($from, $to, $overwrite, true);
        }

        return $this->info($user, $toUri);
    }

    public function delete(User $user, string $uri, bool $permanent = false): void
    {
        $path = $this->pathParser->parse($uri);
        if ($permanent && str_starts_with($path->relativePath, '.trash/')) {
            $this->trashService->deletePermanent($user, $uri);

            return;
        }

        if ($permanent) {
            $resolved = $this->resolve($user, $uri);
            $resolved['adapter']->delete($resolved['relativePath']);

            return;
        }

        $this->trashService->moveToTrash($user, $uri);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listTrash(User $user, string $diskUri): array
    {
        return $this->trashService->listTrash($user, $diskUri);
    }

    /**
     * @return array<string, mixed>
     */
    public function restoreFromTrash(User $user, string $trashUri): array
    {
        return $this->trashService->restore($user, $trashUri);
    }

    public function emptyTrash(User $user, string $diskUri): void
    {
        $this->trashService->emptyTrash($user, $diskUri);
    }

    public function readAbsolutePath(User $user, string $uri): string
    {
        $resolved = $this->resolve($user, $uri);

        return $resolved['adapter']->readAbsolutePath($resolved['relativePath']);
    }

    public function upload(User $user, string $folderUri, string $tempFilePath, string $originalName): array
    {
        $resolved = $this->resolve($user, $folderUri);
        $entry = $resolved['adapter']->writeUpload($resolved['relativePath'], $tempFilePath, $originalName);

        return $this->withUri($resolved, $entry);
    }

    public function writeText(User $user, string $uri, string $content): array
    {
        $resolved = $this->resolve($user, $uri);
        $adapter = $resolved['adapter'];
        if (!method_exists($adapter, 'resolveAbsolutePath')) {
            throw new \RuntimeException('Adapter does not support direct writes');
        }
        /** @var \Explorer\Adapter\LocalVolumeAdapter $adapter */
        $absolute = $adapter->resolveAbsolutePath($resolved['relativePath']);
        $dir = dirname($absolute);
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new \RuntimeException('Unable to create directory');
        }
        if (false === file_put_contents($absolute, $content)) {
            throw new \RuntimeException('Unable to write file');
        }

        return $this->info($user, $uri);
    }

    public function resolveAbsolutePath(User $user, string $uri): string
    {
        $resolved = $this->resolve($user, $uri);
        $adapter = $resolved['adapter'];
        if (!method_exists($adapter, 'resolveAbsolutePath')) {
            throw new \RuntimeException('Adapter does not support path resolution');
        }
        /** @var \Explorer\Adapter\LocalVolumeAdapter $adapter */

        return $adapter->resolveAbsolutePath($resolved['relativePath']);
    }

    /**
     * @return array<string, mixed>
     */
    private function resolve(User $user, string $uri): array
    {
        $path = $this->pathParser->parse($uri);

        return $this->diskRegistry->resolvePath($user, $path);
    }

    /**
     * @param array<string, mixed> $resolved
     * @param array<string, mixed> $entry
     *
     * @return array<string, mixed>
     */
    private function withUri(array $resolved, array $entry): array
    {
        $relative = (string) ($entry['relativePath'] ?? $resolved['relativePath']);
        $path = new ExplorerPath($resolved['disk'], $relative);
        $entry['path'] = $path->toUri();
        $entry['disk'] = $resolved['disk'];

        if (isset($entry['children']) && is_array($entry['children'])) {
            $entry['children'] = array_map(
                fn (array $child): array => $this->withUri($resolved, $child),
                $entry['children'],
            );
        }

        return $entry;
    }

    /**
     * @param array<string, mixed> $from
     * @param array<string, mixed> $to
     */
    private function transferAcrossDisks(array $from, array $to, bool $overwrite, bool $deleteSource): void
    {
        $fromAdapter = $from['adapter'];
        $toAdapter = $to['adapter'];

        if (!method_exists($fromAdapter, 'resolveAbsolutePath') || !method_exists($toAdapter, 'resolveAbsolutePath')) {
            throw new \RuntimeException('Cross-disk transfer is not supported for this adapter');
        }

        /** @var \Explorer\Adapter\LocalVolumeAdapter $fromAdapter */
        /** @var \Explorer\Adapter\LocalVolumeAdapter $toAdapter */
        $fromAbs = $fromAdapter->resolveAbsolutePath($from['relativePath']);
        if (!file_exists($fromAbs)) {
            throw new \RuntimeException('Source not found');
        }

        $toAbs = $toAdapter->resolveAbsolutePath($to['relativePath']);
        if (!$overwrite && file_exists($toAbs)) {
            throw new \RuntimeException('Target already exists');
        }

        $toAdapter->assertWritableDisk();

        if (is_dir($fromAbs)) {
            $this->filesystem->mkdir(dirname($toAbs), 0775);
            $this->filesystem->mirror($fromAbs, $toAbs, null, ['override' => $overwrite]);
        } else {
            $this->filesystem->mkdir(dirname($toAbs), 0775);
            $this->filesystem->copy($fromAbs, $toAbs, $overwrite);
        }

        if ($deleteSource) {
            $fromAdapter->delete($from['relativePath']);
        }
    }
}
