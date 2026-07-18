<?php

namespace Explorer\Adapter;

interface VolumeAdapterInterface
{
    public function getAdapterType(): string;

    /**
     * @return list<array<string, mixed>>
     */
    public function list(string $relativePath, string $sortBy = 'name', string $sortDir = 'asc'): array;

    /**
     * @return array<string, mixed>
     */
    public function info(string $relativePath): array;

    /**
     * @return list<array<string, mixed>>
     */
    public function tree(string $relativePath, int $depth = 1): array;

    public function mkdir(string $relativePath): void;

    public function rename(string $from, string $to): void;

    public function copy(string $from, string $to, bool $overwrite = false): void;

    public function move(string $from, string $to, bool $overwrite = false): void;

    public function delete(string $relativePath): void;

    public function readAbsolutePath(string $relativePath): string;

    public function writeUpload(string $relativePath, string $tempFilePath, string $originalName): array;
}
