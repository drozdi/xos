<?php

namespace Samba\Service;

/** Uncompressed zip so the bundle does not need the zip extension. */
final class ZipStore
{
    /** @var list<array{name: string, data: string, crc: int}> */
    private array $files = [];

    public function add(string $name, string $data): void
    {
        $this->files[] = [
            'name' => str_replace('\\', '/', $name),
            'data' => $data,
            'crc' => crc32($data),
        ];
    }

    public function binary(): string
    {
        $local = '';
        $central = '';
        $offset = 0;
        foreach ($this->files as $file) {
            $name = $file['name'];
            $data = $file['data'];
            $crc = $file['crc'] & 0xFFFFFFFF;
            $size = strlen($data);
            $header = pack('VvvvvvVVVvv', 0x04034B50, 20, 0, 0, 0, 0, $crc, $size, $size, strlen($name), 0);
            $local .= $header.$name.$data;
            $central .= pack('VvvvvvvVVVvvvvvVV', 0x02014B50, 20, 20, 0, 0, 0, 0, $crc, $size, $size, strlen($name), 0, 0, 0, 0, 0, $offset).$name;
            $offset += strlen($header) + strlen($name) + $size;
        }
        $count = count($this->files);

        return $local.$central.pack('VvvvvVVv', 0x06054B50, 0, 0, $count, $count, strlen($central), strlen($local), 0);
    }
}
