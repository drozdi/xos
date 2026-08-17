<?php

namespace Pkb\Service;

use Pkb\Entity\NoteIndex;
use Pkb\Entity\PkbLink;
use Pkb\Entity\Vault;
use Pkb\Repository\NoteIndexRepository;
use Pkb\Repository\PkbLinkRepository;

final class GraphService
{
    private const BROKEN_NODE_PREFIX = '__broken__:';

    public function __construct(
        private readonly NoteIndexRepository $noteIndexRepository,
        private readonly PkbLinkRepository $pkbLinkRepository,
    ) {
    }

    /**
     * @return array{
     *     nodes: list<array{id: string, title: string, degree: int, tags: list<string>}>,
     *     edges: list<array{source: string, target: string, type: string}>
     * }
     */
    public function buildGraph(Vault $vault, ?string $filter = null, int $limit = 1000): array
    {
        $limit = max(1, min(5000, $limit));
        $tagFilter = $this->parseTagFilter($filter);

        $notes = $this->noteIndexRepository->findByVault($vault);
        if (null !== $tagFilter) {
            $notes = array_values(array_filter(
                $notes,
                static fn (NoteIndex $note): bool => in_array($tagFilter, $note->getTags(), true),
            ));
        }

        if (count($notes) > $limit) {
            $notes = array_slice($notes, 0, $limit);
        }

        $visibleNodeIds = [];
        $nodes = [];
        foreach ($notes as $note) {
            $nodeId = $note->getPath();
            $visibleNodeIds[$nodeId] = true;
            $nodes[] = [
                'id' => $nodeId,
                'title' => $note->getTitle(),
                'degree' => $note->getInboundCount() + $note->getOutboundCount(),
                'tags' => $note->getTags(),
            ];
        }

        $links = $this->pkbLinkRepository->findGraphLinks($vault);
        $edges = [];
        $brokenNodes = [];

        foreach ($links as $link) {
            if (PkbLink::TYPE_TAG === $link->getLinkType()) {
                continue;
            }

            $source = $link->getSourcePath();
            if (!isset($visibleNodeIds[$source])) {
                continue;
            }

            $targetPath = $link->getTargetPath();
            if (null !== $targetPath) {
                if (!isset($visibleNodeIds[$targetPath])) {
                    continue;
                }
                $target = $targetPath;
            } else {
                $target = self::BROKEN_NODE_PREFIX.$link->getTargetKey();
                if (!isset($visibleNodeIds[$target])) {
                    $brokenNodes[$target] = $link->getTargetKey();
                }
            }

            $edges[] = [
                'source' => $source,
                'target' => $target,
                'type' => $link->getLinkType(),
            ];
        }

        foreach ($brokenNodes as $nodeId => $title) {
            if (isset($visibleNodeIds[$nodeId])) {
                continue;
            }
            $nodes[] = [
                'id' => $nodeId,
                'title' => $title,
                'degree' => 0,
                'tags' => [],
            ];
        }

        return [
            'nodes' => $nodes,
            'edges' => $edges,
        ];
    }

    private function parseTagFilter(?string $filter): ?string
    {
        if (null === $filter || '' === $filter) {
            return null;
        }

        if (!str_starts_with($filter, 'tag:')) {
            return null;
        }

        $tag = substr($filter, 4);

        return '' !== $tag ? $tag : null;
    }
}
