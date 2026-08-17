<?php

namespace Pkb\Service;

use Main\Entity\User;
use Pkb\Entity\Vault;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class VaultBookmarksService
{
    private const BOOKMARKS_PATH = '.xos-vault/bookmarks.json';

    public function __construct(
        private readonly VaultFileService $vaultFileService,
    ) {
    }

    /**
     * @return array{version: int, items: list<array{path: string, title: string, addedAt: string}>}
     */
    public function getBookmarks(Vault $vault, User $user): array
    {
        try {
            $raw = $this->vaultFileService->getContent($vault, $user, self::BOOKMARKS_PATH);
        } catch (\Throwable) {
            return $this->writeEmptyBookmarks($vault, $user);
        }

        if ('' === trim($raw)) {
            return $this->writeEmptyBookmarks($vault, $user);
        }

        /** @var array<string, mixed>|null $decoded */
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            return $this->writeEmptyBookmarks($vault, $user);
        }

        return $this->normalizeBookmarks($decoded);
    }

    /**
     * @param list<array{path?: mixed, title?: mixed, addedAt?: mixed}> $items
     *
     * @return array{version: int, items: list<array{path: string, title: string, addedAt: string}>}
     */
    public function putBookmarks(Vault $vault, User $user, array $items): array
    {
        $normalized = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }
            $path = trim((string) ($item['path'] ?? ''));
            if ('' === $path) {
                throw new BadRequestHttpException('path обязателен для каждой закладки');
            }
            $title = trim((string) ($item['title'] ?? ''));
            if ('' === $title) {
                $title = pathinfo($path, PATHINFO_FILENAME);
            }
            $addedAt = trim((string) ($item['addedAt'] ?? ''));
            if ('' === $addedAt) {
                $addedAt = (new \DateTimeImmutable())->format('c');
            }
            $normalized[] = [
                'path' => $path,
                'title' => $title,
                'addedAt' => $addedAt,
            ];
        }

        $payload = [
            'version' => 1,
            'items' => $normalized,
        ];

        $this->vaultFileService->putContent(
            $vault,
            $user,
            self::BOOKMARKS_PATH,
            json_encode($payload, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        );

        return $payload;
    }

    /**
     * @return array{version: int, items: list<array{path: string, title: string, addedAt: string}>}
     */
    private function writeEmptyBookmarks(Vault $vault, User $user): array
    {
        $payload = ['version' => 1, 'items' => []];

        try {
            $this->vaultFileService->putContent(
                $vault,
                $user,
                self::BOOKMARKS_PATH,
                json_encode($payload, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
            );
        } catch (\Throwable) {
            // Read-only users get empty in-memory payload without persisting.
        }

        return $payload;
    }

    /**
     * @param array<string, mixed> $decoded
     *
     * @return array{version: int, items: list<array{path: string, title: string, addedAt: string}>}
     */
    private function normalizeBookmarks(array $decoded): array
    {
        $items = [];
        if (isset($decoded['items']) && is_array($decoded['items'])) {
            foreach ($decoded['items'] as $item) {
                if (!is_array($item)) {
                    continue;
                }
                $path = trim((string) ($item['path'] ?? ''));
                if ('' === $path) {
                    continue;
                }
                $title = trim((string) ($item['title'] ?? ''));
                if ('' === $title) {
                    $title = pathinfo($path, PATHINFO_FILENAME);
                }
                $addedAt = trim((string) ($item['addedAt'] ?? ''));
                if ('' === $addedAt) {
                    $addedAt = (new \DateTimeImmutable())->format('c');
                }
                $items[] = [
                    'path' => $path,
                    'title' => $title,
                    'addedAt' => $addedAt,
                ];
            }
        }

        return [
            'version' => (int) ($decoded['version'] ?? 1),
            'items' => $items,
        ];
    }
}
