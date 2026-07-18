<?php

namespace Explorer\Model;

final class ExplorerPath
{
    public function __construct(
        public readonly string $disk,
        public readonly string $relativePath,
    ) {
    }

    public function toUri(): string
    {
        $path = trim(str_replace('\\', '/', $this->relativePath), '/');

        return '' === $path
            ? strtolower($this->disk).'://'
            : strtolower($this->disk).'://'.$path;
    }

    public function name(): string
    {
        $normalized = trim(str_replace('\\', '/', $this->relativePath), '/');
        if ('' === $normalized) {
            return '';
        }
        $parts = explode('/', $normalized);

        return (string) end($parts);
    }
}
