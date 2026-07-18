<?php

namespace Explorer\Service;

use Main\Entity\User;
use ZipArchive;

final class ArchiveService
{
    public function __construct(
        private readonly ExplorerManager $explorerManager,
        private readonly ExplorerPathValidator $pathValidator,
    ) {
    }

    /**
     * @param list<string> $sourceUris
     *
     * @return array<string, mixed>
     */
    public function pack(User $user, array $sourceUris, string $destinationUri): array
    {
        $this->assertZipAvailable();

        if ([] === $sourceUris) {
            throw new \InvalidArgumentException('sources are required');
        }

        $destinationAbsolute = $this->explorerManager->resolveAbsolutePath($user, $destinationUri);
        if (!str_ends_with(strtolower($destinationAbsolute), '.zip')) {
            throw new \InvalidArgumentException('Destination must be a .zip file');
        }

        $parent = dirname($destinationAbsolute);
        if (!is_dir($parent) && !mkdir($parent, 0775, true) && !is_dir($parent)) {
            throw new \RuntimeException('Unable to create destination directory');
        }

        $zip = new ZipArchive();
        if (true !== $zip->open($destinationAbsolute, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
            throw new \RuntimeException('Unable to create archive');
        }

        foreach ($sourceUris as $sourceUri) {
            $absolute = $this->explorerManager->readAbsolutePath($user, $sourceUri);
            $baseName = basename(str_replace('\\', '/', $absolute));
            $this->addPathToZip($zip, $absolute, $baseName);
        }

        $zip->close();

        return $this->explorerManager->info($user, $destinationUri);
    }

    /**
     * @return array<string, mixed>
     */
    public function unpack(User $user, string $archiveUri, string $destinationUri): array
    {
        $this->assertZipAvailable();

        $archiveAbsolute = $this->explorerManager->readAbsolutePath($user, $archiveUri);
        $destinationAbsolute = $this->explorerManager->resolveAbsolutePath($user, $destinationUri);

        if (!is_dir($destinationAbsolute) && !mkdir($destinationAbsolute, 0775, true) && !is_dir($destinationAbsolute)) {
            throw new \RuntimeException('Unable to create destination directory');
        }

        $zip = new ZipArchive();
        if (true !== $zip->open($archiveAbsolute)) {
            throw new \RuntimeException('Unable to open archive');
        }

        $extracted = 0;
        for ($index = 0; $index < $zip->numFiles; ++$index) {
            $entryName = (string) $zip->getNameIndex($index);
            if ($this->isUnsafeArchiveEntry($entryName)) {
                continue;
            }

            $targetPath = rtrim($destinationAbsolute, '/\\').'/'.str_replace('\\', '/', $entryName);
            $this->pathValidator->assertSafeAbsolutePath($destinationAbsolute, $targetPath);

            $stat = $zip->statIndex($index);
            if (false === $stat) {
                continue;
            }

            if (str_ends_with($entryName, '/')) {
                if (!is_dir($targetPath) && !mkdir($targetPath, 0775, true) && !is_dir($targetPath)) {
                    throw new \RuntimeException('Unable to create directory from archive');
                }
                ++$extracted;
                continue;
            }

            $targetDir = dirname($targetPath);
            if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true) && !is_dir($targetDir)) {
                throw new \RuntimeException('Unable to create directory from archive');
            }

            $stream = $zip->getStream($entryName);
            if (false === $stream) {
                throw new \RuntimeException('Unable to read archive entry');
            }

            $output = fopen($targetPath, 'wb');
            if (false === $output) {
                fclose($stream);
                throw new \RuntimeException('Unable to write extracted file');
            }

            stream_copy_to_stream($stream, $output);
            fclose($stream);
            fclose($output);
            ++$extracted;
        }

        $zip->close();

        return [
            'archive' => $archiveUri,
            'destination' => $destinationUri,
            'extracted' => $extracted,
        ];
    }

    /**
     * @return list<array{name: string, size: int, folder: bool}>
     */
    public function listContents(User $user, string $archiveUri): array
    {
        $this->assertZipAvailable();

        $archiveAbsolute = $this->explorerManager->readAbsolutePath($user, $archiveUri);
        $zip = new ZipArchive();
        if (true !== $zip->open($archiveAbsolute)) {
            throw new \RuntimeException('Unable to open archive');
        }

        $items = [];
        for ($index = 0; $index < $zip->numFiles; ++$index) {
            $stat = $zip->statIndex($index);
            if (false === $stat) {
                continue;
            }
            $name = (string) ($stat['name'] ?? '');
            if ($this->isUnsafeArchiveEntry($name)) {
                continue;
            }
            $items[] = [
                'name' => $name,
                'size' => (int) ($stat['size'] ?? 0),
                'folder' => str_ends_with($name, '/'),
            ];
        }

        $zip->close();

        return $items;
    }

    private function addPathToZip(ZipArchive $zip, string $absolutePath, string $entryName): void
    {
        if (is_file($absolutePath)) {
            $zip->addFile($absolutePath, str_replace('\\', '/', $entryName));

            return;
        }

        if (!is_dir($absolutePath)) {
            throw new \RuntimeException('Source not found');
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($absolutePath, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $fileInfo) {
            /** @var \SplFileInfo $fileInfo */
            $localPath = str_replace('\\', '/', $entryName.'/'.substr($fileInfo->getPathname(), strlen($absolutePath) + 1));
            if ($fileInfo->isDir()) {
                $zip->addEmptyDir(rtrim($localPath, '/').'/');
            } else {
                $zip->addFile($fileInfo->getPathname(), $localPath);
            }
        }
    }

    private function isUnsafeArchiveEntry(string $entryName): bool
    {
        $normalized = str_replace('\\', '/', $entryName);
        if ('' === $normalized || str_starts_with($normalized, '/')) {
            return true;
        }

        foreach (explode('/', $normalized) as $segment) {
            if ('..' === $segment) {
                return true;
            }
        }

        return false;
    }

    private function assertZipAvailable(): void
    {
        if (!class_exists(ZipArchive::class)) {
            throw new \RuntimeException('Zip extension is not available');
        }
    }
}
