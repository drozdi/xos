<?php

namespace Explorer\Service;

use Explorer\Model\ExplorerPath;

final class ExplorerPathParser
{
    public function parse(string $uri): ExplorerPath
    {
        $uri = trim($uri);
        if (!preg_match('#^([a-zA-Z0-9_-]+)://(.*)$#', $uri, $matches)) {
            throw new \InvalidArgumentException('Invalid explorer path format. Expected disk://path');
        }

        $disk = strtolower($matches[1]);
        $relative = $this->normalizeRelativePath($matches[2]);

        return new ExplorerPath($disk, $relative);
    }

    public function normalizeRelativePath(string $path): string
    {
        $path = str_replace('\\', '/', trim($path));
        $path = trim($path, '/');
        if ('' === $path) {
            return '';
        }

        $parts = [];
        foreach (explode('/', $path) as $segment) {
            if ('' === $segment || '.' === $segment) {
                continue;
            }
            if ('..' === $segment) {
                throw new \InvalidArgumentException('Path traversal is not allowed');
            }
            $parts[] = $segment;
        }

        return implode('/', $parts);
    }
}
