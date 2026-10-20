<?php

namespace App\Tests\Explorer;

use Explorer\Adapter\YandexDiskVolumeAdapter;
use Explorer\Service\FileTypeRegistry;
use Explorer\Service\YandexDiskApiClient;
use PHPUnit\Framework\TestCase;

class YandexDiskVolumeAdapterTest extends TestCase
{
    public function testListMapsEmbeddedItems(): void
    {
        $client = new class('token') extends YandexDiskApiClient {
            public function request(string $method, string $path, ?array $query = null, ?array $jsonBody = null): array
            {
                return [
                    'status' => 200,
                    'data' => [
                        '_embedded' => [
                            'items' => [
                                [
                                    'name' => 'docs',
                                    'type' => 'dir',
                                    'modified' => '2026-01-01T00:00:00+00:00',
                                ],
                                [
                                    'name' => 'note.txt',
                                    'type' => 'file',
                                    'size' => 12,
                                    'modified' => '2026-01-02T00:00:00+00:00',
                                ],
                                [
                                    'name' => '.hidden',
                                    'type' => 'file',
                                    'size' => 1,
                                ],
                            ],
                        ],
                    ],
                    'headers' => [],
                ];
            }
        };

        $registry = new FileTypeRegistry(sys_get_temp_dir().'/missing-file-types.json');
        $adapter = new YandexDiskVolumeAdapter($client, $registry);
        $items = $adapter->list('');

        self::assertCount(2, $items);
        self::assertSame('docs', $items[0]['name']);
        self::assertSame('folder', $items[0]['type']);
        self::assertSame('note.txt', $items[1]['name']);
        self::assertSame('file', $items[1]['type']);
    }

    public function testMkdirAwaitsAsyncOperation(): void
    {
        $client = new class('token') extends YandexDiskApiClient {
            public int $awaitCalls = 0;

            public function request(string $method, string $path, ?array $query = null, ?array $jsonBody = null): array
            {
                return [
                    'status' => 202,
                    'data' => ['href' => 'https://example.test/op'],
                    'headers' => [],
                ];
            }

            public function awaitOperation(array $operationPayload): void
            {
                ++$this->awaitCalls;
            }
        };

        $registry = new FileTypeRegistry(sys_get_temp_dir().'/missing-file-types.json');
        $adapter = new YandexDiskVolumeAdapter($client, $registry);
        $adapter->mkdir('folder');

        self::assertSame(1, $client->awaitCalls);
    }
}
