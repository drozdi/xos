<?php

namespace Explorer\Service;

final class FileTypeRegistry
{
    /** @var array<string, array{label: string, extensions: list<string>}> */
    private array $types = [];

    /** @var array<string, list<string>> */
    private array $openWith = [];

    /** @var array<string, string> */
    private array $extensionMap = [];

    public function __construct(string $configPath)
    {
        if (!is_file($configPath)) {
            return;
        }

        $data = json_decode((string) file_get_contents($configPath), true);
        if (!is_array($data)) {
            return;
        }

        $this->types = $data['types'] ?? [];
        $this->openWith = $data['openWith'] ?? [];

        foreach ($this->types as $type => $meta) {
            foreach ($meta['extensions'] ?? [] as $ext) {
                $this->extensionMap[strtolower((string) $ext)] = $type;
            }
        }
    }

    public function resolveType(?string $extension, bool $isDir): string
    {
        if ($isDir) {
            return 'folder';
        }

        if (null === $extension || '' === $extension) {
            return 'binary';
        }

        return $this->extensionMap[strtolower($extension)] ?? 'binary';
    }

    /**
     * @return list<string>
     */
    public function openWithApps(string $fileType): array
    {
        return $this->openWith[$fileType] ?? [];
    }

    /**
     * @return array<string, array{label: string, extensions: list<string>}>
     */
    public function allTypes(): array
    {
        return $this->types;
    }

    /**
     * @return array<string, list<string>>
     */
    public function allOpenWith(): array
    {
        return $this->openWith;
    }
}
