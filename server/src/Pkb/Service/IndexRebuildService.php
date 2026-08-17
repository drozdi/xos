<?php

namespace Pkb\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Pkb\Entity\Vault;
use Pkb\Repository\NoteIndexRepository;
use Pkb\Repository\PkbLinkRepository;

final class IndexRebuildService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly VaultFileService $vaultFileService,
        private readonly LinkIndexService $linkIndexService,
        private readonly NoteIndexRepository $noteIndexRepository,
    ) {
    }

    /**
     * @return array{noteCount: int, indexed: int, removed: int, index_version: int}
     */
    public function rebuildVaultIndex(Vault $vault, User $user): array
    {
        $markdownFiles = $this->vaultFileService->listAllMarkdownFiles($vault, $user);
        $indexedPaths = [];

        foreach ($markdownFiles as $file) {
            $path = $file['path'];
            $content = $this->vaultFileService->getContent($vault, $user, $path);
            $mtime = isset($file['modified_at']) ? new \DateTime((string) $file['modified_at']) : null;
            $this->linkIndexService->parseAndUpsert($vault, $path, $content, $mtime);
            $indexedPaths[] = $path;
        }

        $removed = 0;
        $notes = $this->noteIndexRepository->findByVault($vault);
        $indexedSet = array_flip($indexedPaths);
        foreach ($notes as $note) {
            if (!isset($indexedSet[$note->getPath()])) {
                $this->linkIndexService->removeNoteFromIndex($vault, $note->getPath());
                ++$removed;
            }
        }

        $vault
            ->setIndexStale(false)
            ->setIndexVersion($vault->getIndexVersion() + 1);

        $this->entityManager->flush();

        return [
            'noteCount' => count($indexedPaths),
            'indexed' => count($indexedPaths),
            'removed' => $removed,
            'index_version' => $vault->getIndexVersion(),
        ];
    }

    /**
     * @return array{stale: bool, noteCount: int, lastIndexedAt: ?string, index_version: int}
     */
    public function getIndexStatus(Vault $vault): array
    {
        $lastIndexedAt = $this->noteIndexRepository->findLatestIndexedAt($vault);

        return [
            'stale' => $vault->isIndexStale(),
            'noteCount' => $this->noteIndexRepository->countByVault($vault),
            'lastIndexedAt' => $lastIndexedAt?->format('Y-m-d H:i:s'),
            'index_version' => $vault->getIndexVersion(),
        ];
    }

    public function markIndexStale(Vault $vault): void
    {
        if ($vault->isIndexStale()) {
            return;
        }

        $vault->setIndexStale(true);
        $this->entityManager->flush();
    }
}
