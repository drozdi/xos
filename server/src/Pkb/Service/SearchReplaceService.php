<?php

namespace Pkb\Service;

use Main\Entity\User;
use Pkb\Entity\Vault;
use Pkb\Repository\NoteIndexRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class SearchReplaceService
{
    public function __construct(
        private readonly NoteIndexRepository $noteIndexRepository,
        private readonly VaultFileService $vaultFileService,
    ) {
    }

    /**
     * @return array{matchedFiles: int, replacedFiles: int, paths: list<string>}
     */
    public function searchReplace(
        Vault $vault,
        User $user,
        string $find,
        string $replace,
        bool $dryRun = false,
    ): array {
        if ('' === $find) {
            throw new BadRequestHttpException('find обязателен');
        }

        $notes = $this->noteIndexRepository->findByVault($vault);
        $matchedPaths = [];

        foreach ($notes as $note) {
            $path = $note->getPath();
            try {
                $content = $this->vaultFileService->getContent($vault, $user, $path);
            } catch (\Throwable) {
                continue;
            }

            if (!str_contains($content, $find)) {
                continue;
            }

            $matchedPaths[] = $path;

            if (!$dryRun) {
                $newContent = str_replace($find, $replace, $content);
                if ($newContent !== $content) {
                    $this->vaultFileService->putContent($vault, $user, $path, $newContent);
                }
            }
        }

        sort($matchedPaths);

        return [
            'matchedFiles' => count($matchedPaths),
            'replacedFiles' => $dryRun ? 0 : count($matchedPaths),
            'paths' => $matchedPaths,
        ];
    }
}
