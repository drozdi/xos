<?php

namespace Explorer\Adapter;

use Explorer\Model\FilePermissions;
use Explorer\Service\FileTypeRegistry;
use Explorer\Service\YandexDiskApiClient;

final class YandexDiskVolumeAdapter implements VolumeAdapterInterface
{
    private readonly string $rootPath;

    public function __construct(
        private readonly YandexDiskApiClient $client,
        private readonly FileTypeRegistry $fileTypeRegistry,
        private readonly int $permissions = FilePermissions::ALL,
        private readonly bool $readOnly = false,
        string $rootPath = 'disk:/',
    ) {
        $normalized = trim(str_replace('\\', '/', $rootPath));
        if ('' === $normalized) {
            $normalized = 'disk:/';
        }
        if (!str_starts_with($normalized, 'disk:')) {
            $normalized = 'disk:/'.ltrim($normalized, '/');
        }
        $this->rootPath = rtrim($normalized, '/') ?: 'disk:/';
    }

    public function getAdapterType(): string
    {
        return 'yandex_disk';
    }

    public function list(string $relativePath, string $sortBy = 'name', string $sortDir = 'asc'): array
    {
        $path = $this->toDiskPath($relativePath);
        $response = $this->client->request('GET', '/disk/resources', [
            'path' => $path,
            'limit' => 1000,
            'offset' => 0,
        ]);
        $data = is_array($response['data']) ? $response['data'] : [];
        $embedded = is_array($data['_embedded'] ?? null) ? $data['_embedded'] : [];
        $itemsRaw = is_array($embedded['items'] ?? null) ? $embedded['items'] : [];

        $items = [];
        foreach ($itemsRaw as $item) {
            if (!is_array($item)) {
                continue;
            }
            $name = (string) ($item['name'] ?? '');
            if ('' === $name || str_starts_with($name, '.')) {
                continue;
            }
            $items[] = $this->mapResource($item, $relativePath);
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
        $path = $this->toDiskPath($relativePath);
        $response = $this->client->request('GET', '/disk/resources', ['path' => $path]);
        $data = is_array($response['data']) ? $response['data'] : [];

        return $this->mapResource($data, '', trim(str_replace('\\', '/', $relativePath), '/'));
    }

    public function tree(string $relativePath, int $depth = 1): array
    {
        $entry = $this->info($relativePath);
        if ('folder' !== ($entry['type'] ?? '') || $depth <= 0) {
            return $entry;
        }

        $children = [];
        foreach ($this->list($relativePath) as $child) {
            if ('folder' === ($child['type'] ?? '')) {
                $children[] = $this->tree((string) $child['relativePath'], $depth - 1);
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
        $response = $this->client->request('PUT', '/disk/resources', [
            'path' => $this->toDiskPath($relativePath),
        ]);
        if (202 === $response['status'] && is_array($response['data'])) {
            $this->client->awaitOperation($response['data']);
        }
    }

    public function rename(string $from, string $to): void
    {
        $this->move($from, $to, false);
    }

    public function copy(string $from, string $to, bool $overwrite = false): void
    {
        $this->assertWritable();
        $response = $this->client->request('POST', '/disk/resources/copy', [
            'from' => $this->toDiskPath($from),
            'path' => $this->toDiskPath($to),
            'overwrite' => $overwrite ? 'true' : 'false',
        ]);
        if (202 === $response['status'] && is_array($response['data'])) {
            $this->client->awaitOperation($response['data']);
        }
    }

    public function move(string $from, string $to, bool $overwrite = false): void
    {
        $this->assertWritable();
        $response = $this->client->request('POST', '/disk/resources/move', [
            'from' => $this->toDiskPath($from),
            'path' => $this->toDiskPath($to),
            'overwrite' => $overwrite ? 'true' : 'false',
        ]);
        if (202 === $response['status'] && is_array($response['data'])) {
            $this->client->awaitOperation($response['data']);
        }
    }

    public function delete(string $relativePath): void
    {
        $this->assertWritable();
        if (!FilePermissions::has($this->permissions, FilePermissions::DELETE)) {
            throw new \RuntimeException('Delete is not allowed on this disk');
        }
        $response = $this->client->request('DELETE', '/disk/resources', [
            'path' => $this->toDiskPath($relativePath),
            'permanently' => 'true',
        ]);
        if (202 === $response['status'] && is_array($response['data'])) {
            $this->client->awaitOperation($response['data']);
        }
    }

    public function readAbsolutePath(string $relativePath): string
    {
        $temp = tempnam(sys_get_temp_dir(), 'xos-yd-');
        if (false === $temp) {
            throw new \RuntimeException('Unable to create temp file');
        }
        $stream = $this->openDownload($relativePath);
        try {
            $out = fopen($temp, 'wb');
            if (false === $out) {
                throw new \RuntimeException('Unable to write temp file');
            }
            try {
                stream_copy_to_stream($stream, $out);
            } finally {
                fclose($out);
            }
        } finally {
            fclose($stream);
        }

        return $temp;
    }

    public function writeUpload(string $relativePath, string $tempFilePath, string $originalName): array
    {
        $this->assertWritable();
        $targetRelative = '' === trim($relativePath, '/')
            ? $originalName
            : trim($relativePath, '/').'/'.$originalName;
        $href = $this->requestUploadHref($targetRelative, true);
        $this->client->putFile($href, $tempFilePath);

        return $this->info($targetRelative);
    }

    public function readContents(string $relativePath): string
    {
        $stream = $this->openDownload($relativePath);
        try {
            $contents = stream_get_contents($stream);
            if (false === $contents) {
                throw new \RuntimeException('Unable to read file contents');
            }

            return $contents;
        } finally {
            fclose($stream);
        }
    }

    public function writeContents(string $relativePath, string $contents): void
    {
        $this->assertWritable();
        $parent = dirname(str_replace('\\', '/', $relativePath));
        if ('.' !== $parent && '' !== $parent) {
            try {
                $this->mkdir($parent);
            } catch (\Throwable) {
                // parent may already exist
            }
        }
        $href = $this->requestUploadHref($relativePath, true);
        $this->client->putBinary($href, $contents);
    }

    public function openDownload(string $relativePath)
    {
        $response = $this->client->request('GET', '/disk/resources/download', [
            'path' => $this->toDiskPath($relativePath),
        ]);
        $href = is_array($response['data']) ? (string) ($response['data']['href'] ?? '') : '';
        if ('' === $href) {
            throw new \RuntimeException('Download href missing');
        }

        return $this->client->openUrlStream($href);
    }

    private function requestUploadHref(string $relativePath, bool $overwrite): string
    {
        $response = $this->client->request('GET', '/disk/resources/upload', [
            'path' => $this->toDiskPath($relativePath),
            'overwrite' => $overwrite ? 'true' : 'false',
        ]);
        $href = is_array($response['data']) ? (string) ($response['data']['href'] ?? '') : '';
        if ('' === $href) {
            throw new \RuntimeException('Upload href missing');
        }

        return $href;
    }

    private function toDiskPath(string $relativePath): string
    {
        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');
        if ('' === $relativePath) {
            return $this->rootPath === 'disk:' ? 'disk:/' : $this->rootPath;
        }

        $base = rtrim($this->rootPath, '/');

        return $base.'/'.$relativePath;
    }

    /**
     * @param array<string, mixed> $resource
     *
     * @return array<string, mixed>
     */
    private function mapResource(array $resource, string $parentRelative, ?string $forcedRelative = null): array
    {
        $name = (string) ($resource['name'] ?? '');
        if (null !== $forcedRelative) {
            $relative = trim(str_replace('\\', '/', $forcedRelative), '/');
            if ('' === $name) {
                $name = '' === $relative ? '/' : basename($relative);
            }
        } else {
            $relative = '' === trim($parentRelative, '/')
                ? $name
                : trim($parentRelative, '/').'/'.$name;
        }

        $type = (string) ($resource['type'] ?? 'file');
        $isDir = 'dir' === $type;
        $extension = $isDir ? null : pathinfo($name, PATHINFO_EXTENSION);
        $fileType = $this->fileTypeRegistry->resolveType($isDir ? null : (string) $extension, $isDir);
        $modifiedAt = (string) ($resource['modified'] ?? gmdate('c'));
        $size = $isDir ? 0 : (int) ($resource['size'] ?? 0);
        $entryPermissions = $this->effectivePermissions();

        return [
            'name' => '' === $name ? '/' : $name,
            'relativePath' => $relative,
            'type' => $isDir ? 'folder' : 'file',
            'fileType' => $fileType,
            'extension' => $extension ? strtolower((string) $extension) : null,
            'size' => $size,
            'modifiedAt' => $modifiedAt,
            'permissions' => FilePermissions::toList($entryPermissions),
            'permissionsMask' => $entryPermissions,
            'openWith' => $isDir ? [] : $this->fileTypeRegistry->openWithApps($fileType),
        ];
    }

    private function effectivePermissions(): int
    {
        $mask = $this->permissions;
        if ($this->readOnly) {
            $mask &= FilePermissions::READ | FilePermissions::EXECUTE;
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
