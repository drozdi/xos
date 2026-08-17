<?php

namespace Pkb\Service;

use Pkb\Entity\Vault;
use Pkb\Repository\NoteIndexRepository;

final class SearchService
{
    public function __construct(
        private readonly NoteIndexRepository $noteIndexRepository,
    ) {
    }

    /**
     * @return array{results: list<array{path: string, title: string, excerpt: ?string, tags: list<string>, score: int}>}
     */
    public function search(Vault $vault, string $query, int $limit = 50): array
    {
        $query = trim($query);
        if ('' === $query) {
            return ['results' => []];
        }

        $limit = max(1, min(200, $limit));
        $notes = $this->noteIndexRepository->searchByVault($vault, $query, $limit);

        $results = [];
        foreach ($notes as $note) {
            $title = $note->getTitle();
            $excerpt = $note->getBodyExcerpt();
            $score = 0;

            if (false !== mb_stripos($title, $query)) {
                $score += 10;
                if (0 === strcasecmp($title, $query)) {
                    $score += 5;
                }
            }

            if (null !== $excerpt && false !== mb_stripos($excerpt, $query)) {
                $score += 3;
            }

            $results[] = [
                'path' => $note->getPath(),
                'title' => $title,
                'excerpt' => $excerpt,
                'tags' => $note->getTags(),
                'score' => $score,
            ];
        }

        usort(
            $results,
            static fn (array $a, array $b): int => $b['score'] <=> $a['score'] ?: strcmp($a['path'], $b['path']),
        );

        return ['results' => $results];
    }
}
