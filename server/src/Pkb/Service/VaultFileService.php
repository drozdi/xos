<?php

namespace Pkb\Service;

use Doctrine\ORM\EntityManagerInterface;
use Explorer\Service\ExplorerManager;
use Main\Entity\User;
use Pkb\Entity\Vault;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class VaultFileService
{
    /** @var list<string> */
    private const ALLOWED_EXTENSIONS = ['md', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'pdf'];

    /** @var list<string> */
    private const HIDDEN_NAMES = ['.xos-vault'];

    public function __construct(
        private readonly ExplorerManager $explorerManager,
        private readonly VaultPathResolver $pathResolver,
        private readonly LinkIndexService $linkIndexService,
        private readonly EntityManagerInterface $entityManager,
        private readonly PkbPermissionResolver $permissionResolver,
        private readonly PkbBodyCipher $bodyCipher,
    ) {
    }

    /** @return array<string, mixed> */
    public function getTree(Vault $vault, User $user, ?string $path = null, int $depth = 3): array
    {
        $this->assertCanReadFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);
        $relative = $this->pathResolver->normalizeRelativePath($path ?? '');
        $uri = $this->pathResolver->toExplorerUri($vault, $relative);

        try {
            $tree = $this->explorerManager->tree($fileUser, $uri, $depth);
        } catch (\Throwable $e) {
            throw new NotFoundHttpException('Путь не найден', $e);
        }

        $filtered = $this->filterTreeNode($tree, $vault);
        if (null === $filtered) {
            return [
                'name' => basename($relative) ?: '/',
                'path' => $relative,
                'type' => 'folder',
                'children' => [],
            ];
        }

        return $filtered;
    }

    public function getContent(Vault $vault, User $user, string $path): string
    {
        $this->assertCanReadFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);
        $relative = $this->pathResolver->assertWithinVault($vault, $path);
        $uri = $this->pathResolver->toExplorerUri($vault, $relative);

        try {
            $absolute = $this->explorerManager->readAbsolutePath($fileUser, $uri);
        } catch (\Throwable $e) {
            throw new NotFoundHttpException('Файл не найден', $e);
        }

        if (is_dir($absolute)) {
            throw new BadRequestHttpException('Нельзя прочитать папку как текст');
        }

        $content = file_get_contents($absolute);
        if (false === $content) {
            throw new NotFoundHttpException('Не удалось прочитать файл');
        }

        if ($this->isMarkdownPath($relative) && $vault->isEncryptAtRest()) {
            return $this->bodyCipher->decrypt($content);
        }

        return $content;
    }

    /** @return array<string, mixed> */
    public function putContent(Vault $vault, User $user, string $path, string $content): array
    {
        $this->assertCanWriteFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);
        $relative = $this->pathResolver->assertWithinVault($vault, $path);
        $uri = $this->pathResolver->toExplorerUri($vault, $relative);

        $storedContent = $content;
        if ($this->isMarkdownPath($relative) && $vault->isEncryptAtRest()) {
            if (!$this->bodyCipher->isEnabled()) {
                throw new BadRequestHttpException('PKB_AT_REST_SECRET не задан — нельзя сохранить с encrypt_at_rest');
            }
            $storedContent = $this->bodyCipher->encrypt($content);
        }

        $entry = $this->explorerManager->writeText($fileUser, $uri, $storedContent);

        $result = $this->serializeFileEntry($entry, $relative);

        if ($this->isMarkdownPath($relative)) {
            $mtime = isset($entry['modifiedAt']) ? new \DateTime((string) $entry['modifiedAt']) : null;
            $result['index'] = $this->linkIndexService->parseAndUpsert($vault, $relative, $content, $mtime);
        }

        return $result;
    }

    /**
     * Re-encrypt or decrypt all markdown bodies after vault.encrypt_at_rest toggle.
     */
    public function rewriteMarkdownBodiesForEncryptionFlag(Vault $vault, User $user, bool $encrypt): void
    {
        $this->assertCanWriteFiles($vault, $user);
        if ($encrypt && !$this->bodyCipher->isEnabled()) {
            throw new BadRequestHttpException('PKB_AT_REST_SECRET не задан — нельзя включить encrypt_at_rest');
        }

        $files = $this->listAllMarkdownFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);

        foreach ($files as $file) {
            $relative = $file['path'];
            $uri = $this->pathResolver->toExplorerUri($vault, $relative);
            try {
                $absolute = $this->explorerManager->readAbsolutePath($fileUser, $uri);
            } catch (\Throwable) {
                continue;
            }
            if (is_dir($absolute)) {
                continue;
            }
            $raw = file_get_contents($absolute);
            if (false === $raw) {
                continue;
            }

            if ($encrypt) {
                $plaintext = $this->bodyCipher->isEncrypted($raw) ? $this->bodyCipher->decrypt($raw) : $raw;
                $stored = $this->bodyCipher->encrypt($plaintext);
                $this->explorerManager->writeText($fileUser, $uri, $stored);
                $this->linkIndexService->parseAndUpsert($vault, $relative, $plaintext);
            } else {
                $plaintext = $this->bodyCipher->isEncrypted($raw) ? $this->bodyCipher->decrypt($raw) : $raw;
                $this->explorerManager->writeText($fileUser, $uri, $plaintext);
                $this->linkIndexService->parseAndUpsert($vault, $relative, $plaintext);
            }
        }
    }

    private function isMarkdownPath(string $path): bool
    {
        return str_ends_with(strtolower($path), '.md');
    }

    /** @return array<string, mixed> */
    public function createFolder(Vault $vault, User $user, string $path): array
    {
        $this->assertCanWriteFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);
        $relative = $this->pathResolver->assertWithinVault($vault, $path);
        $uri = $this->pathResolver->toExplorerUri($vault, $relative);

        $entry = $this->explorerManager->mkdir($fileUser, $uri);

        return $this->serializeFileEntry($entry, $relative);
    }

    public function deleteItem(Vault $vault, User $user, string $path): void
    {
        $this->assertCanWriteFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);
        $relative = $this->pathResolver->assertWithinVault($vault, $path);

        if ('' === $relative || in_array(basename($relative), self::HIDDEN_NAMES, true)) {
            throw new BadRequestHttpException('Нельзя удалить системную папку vault');
        }

        $uri = $this->pathResolver->toExplorerUri($vault, $relative);
        $this->explorerManager->delete($fileUser, $uri, true);

        if (str_ends_with(strtolower($relative), '.md')) {
            $this->linkIndexService->removeNoteFromIndex($vault, $relative);
        }

        if (!$vault->isIndexStale()) {
            $vault->setIndexStale(true);
            $this->entityManager->flush();
        }
    }

    /**
     * @return list<array{path: string, modified_at: ?string}>
     */
    public function listAllMarkdownFiles(Vault $vault, User $user): array
    {
        $this->assertCanReadFiles($vault, $user);
        $tree = $this->getTree($vault, $user, null, 10);

        return $this->collectMarkdownFiles($tree);
    }

    /**
     * @param array<string, mixed> $node
     *
     * @return list<array{path: string, modified_at: ?string}>
     */
    private function collectMarkdownFiles(array $node): array
    {
        $files = [];
        $type = (string) ($node['type'] ?? 'file');

        if ('file' === $type) {
            $path = (string) ($node['path'] ?? '');
            $ext = strtolower((string) ($node['extension'] ?? ''));
            if ('md' === $ext && '' !== $path) {
                $files[] = [
                    'path' => $path,
                    'modified_at' => isset($node['modified_at']) ? (string) $node['modified_at'] : null,
                ];
            }

            return $files;
        }

        if (isset($node['children']) && is_array($node['children'])) {
            foreach ($node['children'] as $child) {
                if (is_array($child)) {
                    $files = array_merge($files, $this->collectMarkdownFiles($child));
                }
            }
        }

        return $files;
    }

    /** @return array<string, mixed> */
    public function renameOrMove(Vault $vault, User $user, string $fromPath, string $toPath): array
    {
        $this->assertCanWriteFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);
        $fromRelative = $this->pathResolver->assertWithinVault($vault, $fromPath);
        $toRelative = $this->pathResolver->assertWithinVault($vault, $toPath);

        if ('' === $fromRelative) {
            throw new BadRequestHttpException('Нельзя переименовать корень vault');
        }

        if (in_array(basename($fromRelative), self::HIDDEN_NAMES, true)
            || in_array(basename($toRelative), self::HIDDEN_NAMES, true)) {
            throw new BadRequestHttpException('Нельзя изменять системную папку vault');
        }

        $fromUri = $this->pathResolver->toExplorerUri($vault, $fromRelative);
        $toUri = $this->pathResolver->toExplorerUri($vault, $toRelative);

        $fromParent = dirname(str_replace('\\', '/', $fromRelative));
        $toParent = dirname(str_replace('\\', '/', $toRelative));
        $fromParent = ('.' === $fromParent) ? '' : $fromParent;
        $toParent = ('.' === $toParent) ? '' : $toParent;

        if ($fromParent === $toParent) {
            $newName = basename(str_replace('\\', '/', $toRelative));
            $entry = $this->explorerManager->rename($fileUser, $fromUri, $newName);
        } else {
            $entry = $this->explorerManager->move($fileUser, $fromUri, $toUri, false);
        }

        return $this->serializeFileEntry($entry, $toRelative);
    }

    /** @return array<string, mixed> */
    public function uploadFile(
        Vault $vault,
        User $user,
        string $folderPath,
        string $tempFilePath,
        string $originalName,
    ): array {
        $this->assertCanWriteFiles($vault, $user);
        $fileUser = $this->resolveFileUser($vault);
        $relative = $this->pathResolver->assertWithinVault($vault, $folderPath);
        $folderUri = $this->pathResolver->toExplorerUri($vault, $relative);

        try {
            $entry = $this->explorerManager->upload($fileUser, $folderUri, $tempFilePath, $originalName);
        } catch (\Throwable $e) {
            throw new BadRequestHttpException($e->getMessage(), $e);
        }

        $explorerRelative = (string) ($entry['relativePath'] ?? $relative.'/'.basename($originalName));
        $vaultRelative = $this->toVaultRelativePath($vault, $explorerRelative);

        return $this->serializeFileEntry($entry, $vaultRelative);
    }

    private function assertCanReadFiles(Vault $vault, User $user): void
    {
        if (!$this->permissionResolver->canReadFiles($vault, $user)) {
            throw new AccessDeniedHttpException('Нет прав на чтение файлов vault');
        }
    }

    private function assertCanWriteFiles(Vault $vault, User $user): void
    {
        if (!$this->permissionResolver->canWriteFiles($vault, $user)) {
            throw new AccessDeniedHttpException('Нет прав на запись файлов vault');
        }
    }

    private function resolveFileUser(Vault $vault): User
    {
        $owner = $vault->getOwner();
        if (!$owner instanceof User) {
            throw new NotFoundHttpException('Владелец vault не найден');
        }

        return $owner;
    }

    /** @param array<string, mixed> $node */
    private function filterTreeNode(array $node, Vault $vault): ?array
    {
        $name = (string) ($node['name'] ?? '');
        $relativePath = (string) ($node['relativePath'] ?? '');
        $type = (string) ($node['type'] ?? 'file');

        if (in_array($name, self::HIDDEN_NAMES, true) || str_starts_with($relativePath, '.xos-vault')) {
            return null;
        }

        if ('file' === $type) {
            $ext = strtolower((string) ($node['extension'] ?? ''));
            if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
                return null;
            }
        }

        $vaultRelative = $this->toVaultRelativePath($vault, $relativePath);

        $result = [
            'name' => $name,
            'path' => $vaultRelative,
            'type' => $type,
            'extension' => $node['extension'] ?? null,
            'hidden' => str_starts_with($name, '.'),
        ];

        if ('folder' === $type && isset($node['children']) && is_array($node['children'])) {
            $children = [];
            foreach ($node['children'] as $child) {
                if (!is_array($child)) {
                    continue;
                }
                $filtered = $this->filterTreeNode($child, $vault);
                if (null !== $filtered) {
                    $children[] = $filtered;
                }
            }
            $result['children'] = $children;
        }

        return $result;
    }

    private function toVaultRelativePath(Vault $vault, string $explorerRelativePath): string
    {
        $prefix = $this->vaultRootRelativePrefix($vault);
        $path = trim(str_replace('\\', '/', $explorerRelativePath), '/');

        if ('' === $path || $path === $prefix) {
            return '';
        }

        if (str_starts_with($path, $prefix.'/')) {
            return substr($path, strlen($prefix) + 1);
        }

        return $path;
    }

    private function vaultRootRelativePrefix(Vault $vault): string
    {
        $rootPath = rtrim($vault->getRootPath(), '/');
        if (preg_match('#^[a-z]+://(.+)$#i', $rootPath, $matches)) {
            return trim($matches[1], '/');
        }

        return trim($rootPath, '/');
    }

    /** @param array<string, mixed> $entry */
    private function serializeFileEntry(array $entry, string $vaultRelativePath): array
    {
        return [
            'name' => $entry['name'] ?? basename($vaultRelativePath),
            'path' => $vaultRelativePath,
            'type' => $entry['type'] ?? 'file',
            'extension' => $entry['extension'] ?? null,
            'size' => $entry['size'] ?? null,
            'modified_at' => $entry['modifiedAt'] ?? null,
        ];
    }
}

