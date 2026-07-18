<?php

namespace Explorer\Adapter;

use Explorer\Model\FilePermissions;
use Explorer\Service\ExplorerPathValidator;
use Explorer\Service\FileTypeRegistry;
use Symfony\Component\Filesystem\Filesystem;

final class LocalVolumeAdapter implements VolumeAdapterInterface
{
    private readonly Filesystem $filesystem;

    public function __construct(
        private readonly string $root,
        private readonly int $permissions,
        private readonly bool $readOnly,
        private readonly FileTypeRegistry $fileTypeRegistry,
        private readonly ExplorerPathValidator $pathValidator,
        private readonly string $adapterType = 'local',
    ) {
        $this->filesystem = new Filesystem();
        if (!is_dir($this->root) && !mkdir($this->root, 0775, true) && !is_dir($this->root)) {
            throw new \RuntimeException('Unable to create disk root');
        }
    }

    public function getAdapterType(): string
    {
        return $this->adapterType;
    }

    public function list(string $relativePath, string $sortBy = 'name', string $sortDir = 'asc'): array
    {
        $absolute = $this->absolutePath($relativePath);
        if (!is_dir($absolute)) {
            throw new \RuntimeException('Directory not found');
        }

        $items = [];
        foreach (scandir($absolute) ?: [] as $entry) {
            if ('.' === $entry || '..' === $entry || str_starts_with($entry, '.')) {
                continue;
            }
            $childRelative = '' === $relativePath ? $entry : $relativePath.'/'.$entry;
            $items[] = $this->buildEntry($childRelative);
        }

        usort($items, function (array $a, array $b) use ($sortBy, $sortDir): int {
            if (($a['type'] ?? '') === 'folder' && ($b['type'] ?? '') !== 'folder') {
                return -1;
            }
            if (($b['type'] ?? '') === 'folder' && ($a['type'] ?? '') !== 'folder') {
                return 1;
            }

            $left = match ($sortBy) {
                'size' => (int) ($a['size'] ?? 0),
                'type' => (string) ($a['fileType'] ?? ''),
                default => mb_strtolower((string) ($a['name'] ?? '')),
            };
            $right = match ($sortBy) {
                'size' => (int) ($b['size'] ?? 0),
                'type' => (string) ($b['fileType'] ?? ''),
                default => mb_strtolower((string) ($b['name'] ?? '')),
            };

            $cmp = $left <=> $right;

            return 'desc' === strtolower($sortDir) ? -$cmp : $cmp;
        });

        return $items;
    }

    public function info(string $relativePath): array
    {
        return $this->buildEntry($relativePath);
    }

    public function tree(string $relativePath, int $depth = 1): array
    {
        $entry = $this->buildEntry($relativePath);
        if ('folder' !== ($entry['type'] ?? '') || $depth <= 0) {
            return $entry;
        }

        $children = [];
        foreach ($this->list($relativePath) as $child) {
            if ('folder' === ($child['type'] ?? '')) {
                $children[] = $this->tree($child['relativePath'], $depth - 1);
            } else {
                $children[] = $child;
            }
        }
        $entry['children'] = $children;

        return $entry;
    }

    public function mkdir(string $relativePath): void
    {
        $this->assertWritable();
        $absolute = $this->absolutePath($relativePath);
        $this->filesystem->mkdir($absolute, 0775);
    }

    public function rename(string $from, string $to): void
    {
        $this->assertWritable();
        $fromAbs = $this->absolutePath($from);
        $toAbs = $this->absolutePath($to);
        $this->pathValidator->assertSafeAbsolutePath($this->root, $toAbs);
        $this->filesystem->rename($fromAbs, $toAbs);
    }

    public function copy(string $from, string $to, bool $overwrite = false): void
    {
        $this->assertWritable();
        $fromAbs = $this->absolutePath($from);
        $toAbs = $this->absolutePath($to);
        $this->pathValidator->assertSafeAbsolutePath($this->root, $toAbs);
        if (!$overwrite && file_exists($toAbs)) {
            throw new \RuntimeException('Target already exists');
        }
        if (is_dir($fromAbs)) {
            $this->filesystem->mirror($fromAbs, $toAbs, null, ['override' => $overwrite]);
        } else {
            $this->filesystem->copy($fromAbs, $toAbs, $overwrite);
        }
    }

    public function move(string $from, string $to, bool $overwrite = false): void
    {
        $this->assertWritable();
        $fromAbs = $this->absolutePath($from);
        $toAbs = $this->absolutePath($to);
        $this->pathValidator->assertSafeAbsolutePath($this->root, $toAbs);
        if (!$overwrite && file_exists($toAbs)) {
            throw new \RuntimeException('Target already exists');
        }
        $this->filesystem->rename($fromAbs, $toAbs, $overwrite);
    }

    public function delete(string $relativePath): void
    {
        $this->assertWritable();
        if (!FilePermissions::has($this->permissions, FilePermissions::DELETE)) {
            throw new \RuntimeException('Delete is not allowed on this disk');
        }
        $absolute = $this->absolutePath($relativePath);
        if (is_dir($absolute)) {
            $this->filesystem->remove($absolute);
        } elseif (file_exists($absolute)) {
            $this->filesystem->remove($absolute);
        }
    }

    public function readAbsolutePath(string $relativePath): string
    {
        $absolute = $this->absolutePath($relativePath);
        if (!file_exists($absolute)) {
            throw new \RuntimeException('File not found');
        }

        return $absolute;
    }

    public function resolveAbsolutePath(string $relativePath): string
    {
        return $this->absolutePath($relativePath);
    }

    public function assertWritableDisk(): void
    {
        $this->assertWritable();
    }

    public function writeUpload(string $relativePath, string $tempFilePath, string $originalName): array
    {
        $this->assertWritable();
        $targetRelative = '' === trim($relativePath, '/')
            ? $originalName
            : trim($relativePath, '/').'/'.$originalName;
        $absolute = $this->absolutePath($targetRelative);
        $this->pathValidator->assertSafeAbsolutePath($this->root, $absolute);
        $this->filesystem->copy($tempFilePath, $absolute, true);

        return $this->buildEntry($targetRelative);
    }

    private function absolutePath(string $relativePath): string
    {
        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');
        $absolute = '' === $relativePath
            ? rtrim($this->root, '/\\')
            : rtrim($this->root, '/\\').'/'.$relativePath;

        return $this->pathValidator->assertSafeAbsolutePath($this->root, $absolute);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildEntry(string $relativePath): array
    {
        $absolute = $this->absolutePath($relativePath);
        $isDir = is_dir($absolute);
        $name = '' === trim($relativePath, '/')
            ? '/'
            : basename(str_replace('\\', '/', $relativePath));
        $extension = $isDir ? null : pathinfo($name, PATHINFO_EXTENSION);
        $fileType = $this->fileTypeRegistry->resolveType($isDir ? null : (string) $extension, $isDir);
        $modifiedAt = @filemtime($absolute) ?: time();
        $size = $isDir ? 0 : (@filesize($absolute) ?: 0);
        $entryPermissions = $this->effectivePermissions($absolute);

        return [
            'name' => $name,
            'relativePath' => trim(str_replace('\\', '/', $relativePath), '/'),
            'type' => $isDir ? 'folder' : 'file',
            'fileType' => $fileType,
            'extension' => $extension ? strtolower((string) $extension) : null,
            'size' => $size,
            'modifiedAt' => gmdate('c', $modifiedAt),
            'permissions' => FilePermissions::toList($entryPermissions),
            'permissionsMask' => $entryPermissions,
            'openWith' => $isDir ? [] : $this->fileTypeRegistry->openWithApps($fileType),
        ];
    }

    private function effectivePermissions(string $absolutePath): int
    {
        $mask = $this->permissions;
        if ($this->readOnly) {
            $mask &= FilePermissions::READ | FilePermissions::EXECUTE;
        }
        if (file_exists($absolutePath) && !is_writable($absolutePath)) {
            $mask &= ~FilePermissions::WRITE;
            $mask &= ~FilePermissions::DELETE;
        }

        return $mask;
    }

    private function assertWritable(): void
    {
        if ($this->readOnly || !FilePermissions::has($this->permissions, FilePermissions::WRITE)) {
            throw new \RuntimeException('Disk is read-only');
        }
    }
}
