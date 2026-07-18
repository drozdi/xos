<?php

namespace Explorer\Service;

use Explorer\Model\ExplorerPath;

final class ExplorerPathValidator
{
    public function __construct(
        private readonly ExplorerPathParser $parser,
    ) {
    }

    public function assertSafeUri(string $uri): ExplorerPath
    {
        return $this->parser->parse($uri);
    }

    public function assertSafeAbsolutePath(string $root, string $absolutePath): string
    {
        $rootReal = realpath($root);
        if (false === $rootReal) {
            throw new \RuntimeException('Disk root is not accessible');
        }

        $parent = dirname($absolutePath);
        if (!is_dir($parent) && !mkdir($parent, 0775, true) && !is_dir($parent)) {
            throw new \RuntimeException('Unable to prepare target directory');
        }

        $targetReal = realpath($absolutePath);
        if (false === $targetReal) {
            $targetReal = $absolutePath;
        }

        $rootPrefix = rtrim(str_replace('\\', '/', $rootReal), '/').'/';
        $targetNorm = str_replace('\\', '/', $targetReal);
        if (!str_starts_with($targetNorm.'/', $rootPrefix) && $targetNorm !== rtrim($rootPrefix, '/')) {
            throw new \InvalidArgumentException('Path is outside disk root');
        }

        return $absolutePath;
    }
}
