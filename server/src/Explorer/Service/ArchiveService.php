<?php

namespace Explorer\Service;

use Main\Entity\User;
use ZipArchive;

final class ArchiveService
{
    public function __construct(
        private readonly ExplorerManager $explorerManager,
        private readonly ExplorerPathParser $pathParser,
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

        $destinationPath = $this->pathParser->parse($destinationUri);
        if (!str_ends_with(strtolower($destinationPath->relativePath), '.zip')) {
            throw new \InvalidArgumentException('Destination must be a .zip file');
        }

        $tempZip = tempnam(sys_get_temp_dir(), 'xos-zip-');
        if (false === $tempZip) {
            throw new \RuntimeException('Unable to create temp archive');
        }
        $tempZipPath = $tempZip.'.zip';
        @unlink($tempZip);
        $stagedSources = [];

        try {
            $zip = new ZipArchive();
            if (true !== $zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE)) {
                throw new \RuntimeException('Unable to create archive');
            }

            foreach ($sourceUris as $sourceUri) {
                $absolute = $this->explorerManager->readAbsolutePath($user, $sourceUri);
                $stagedSources[] = $absolute;
                $parsed = $this->pathParser->parse($sourceUri);
                $baseName = '' === $parsed->relativePath
                    ? basename(str_replace('\\', '/', $absolute))
                    : basename(str_replace('\\', '/', $parsed->relativePath));
                $this->addPathToZip($zip, $absolute, $baseName);
            }

            $zip->close();

            $parent = dirname(str_replace('\\', '/', $destinationPath->relativePath));
            $parent = ('.' === $parent) ? '' : $parent;
            $fileName = basename(str_replace('\\', '/', $destinationPath->relativePath));
            $parentUri = (new \Explorer\Model\ExplorerPath($destinationPath->disk, $parent))->toUri();

            return $this->explorerManager->upload($user, $parentUri, $tempZipPath, $fileName);
        } finally {
            if (is_file($tempZipPath)) {
                @unlink($tempZipPath);
            }
            foreach ($stagedSources as $staged) {
                $this->cleanupStaged($staged);
            }
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function unpack(User $user, string $archiveUri, string $destinationUri): array
    {
        $this->assertZipAvailable();

        $archiveAbsolute = $this->explorerManager->readAbsolutePath($user, $archiveUri);
        $extractRoot = sys_get_temp_dir().'/xos-unzip-'.bin2hex(random_bytes(8));
        if (!mkdir($extractRoot, 0775, true) && !is_dir($extractRoot)) {
            $this->cleanupStaged($archiveAbsolute);
            throw new \RuntimeException('Unable to create extract directory');
        }

        try {
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

                $targetPath = rtrim($extractRoot, '/\\').'/'.str_replace('\\', '/', $entryName);
                $this->pathValidator->assertSafeAbsolutePath($extractRoot, $targetPath);

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

            $this->uploadExtractedTree($user, $extractRoot, $destinationUri);

            return [
                'archive' => $archiveUri,
                'destination' => $destinationUri,
                'extracted' => $extracted,
            ];
        } finally {
            $this->cleanupStaged($archiveAbsolute);
            $this->removeDirectory($extractRoot);
        }
    }

    /**
     * @return list<array{name: string, size: int, folder: bool}>
     */
    public function listContents(User $user, string $archiveUri): array
    {
        $this->assertZipAvailable();

        $archiveAbsolute = $this->explorerManager->readAbsolutePath($user, $archiveUri);
        try {
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
        } finally {
            $this->cleanupStaged($archiveAbsolute);
        }
    }

    private function uploadExtractedTree(User $user, string $extractRoot, string $destinationUri): void
    {
        $destination = $this->pathParser->parse($destinationUri);
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($extractRoot, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST,
        );

        foreach ($iterator as $fileInfo) {
            /** @var \SplFileInfo $fileInfo */
            $relative = ltrim(str_replace('\\', '/', substr($fileInfo->getPathname(), strlen($extractRoot))), '/');
            if ('' === $relative) {
                continue;
            }
            $targetRelative = '' === $destination->relativePath
                ? $relative
                : rtrim($destination->relativePath, '/').'/'.$relative;
            $targetUri = (new \Explorer\Model\ExplorerPath($destination->disk, $targetRelative))->toUri();

            if ($fileInfo->isDir()) {
                try {
                    $this->explorerManager->mkdir($user, $targetUri);
                } catch (\Throwable) {
                }
                continue;
            }

            $parentRelative = dirname(str_replace('\\', '/', $targetRelative));
            $parentRelative = ('.' === $parentRelative) ? '' : $parentRelative;
            $parentUri = (new \Explorer\Model\ExplorerPath($destination->disk, $parentRelative))->toUri();
            $this->explorerManager->upload($user, $parentUri, $fileInfo->getPathname(), basename($relative));
        }
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

    private function cleanupStaged(string $path): void
    {
        $tempDir = realpath(sys_get_temp_dir()) ?: sys_get_temp_dir();
        $real = realpath($path) ?: $path;
        if (str_starts_with($real, $tempDir) && is_file($real) && str_contains(basename($real), 'xos-yd-')) {
            @unlink($real);
        }
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($iterator as $fileInfo) {
            /** @var \SplFileInfo $fileInfo */
            if ($fileInfo->isDir()) {
                @rmdir($fileInfo->getPathname());
            } else {
                @unlink($fileInfo->getPathname());
            }
        }
        @rmdir($directory);
    }

    private function assertZipAvailable(): void
    {
        if (!class_exists(ZipArchive::class)) {
            throw new \RuntimeException('Zip extension is not available');
        }
    }
}
