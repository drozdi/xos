<?php

namespace Pkb\Parser;

final class WikilinkParser
{
    private const PATTERN_EMBED = '/!\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]/';
    private const PATTERN_WIKILINK = '/\[\[([^\]|#]+)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]/';
    private const PATTERN_TAG = '/(?<![\w])#([a-zA-Z][\w\/-]*)/';

    /**
     * @return list<ParsedLink>
     */
    public function parse(string $content): array
    {
        $links = [];
        $occupied = [];

        if (preg_match_all(self::PATTERN_EMBED, $content, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[0] as $index => $fullMatch) {
                $position = $fullMatch[1];
                $target = $this->normalizeTargetKey((string) $matches[1][$index][0]);
                $alias = isset($matches[2][$index][0]) ? trim((string) $matches[2][$index][0]) : null;
                if ('' === $target) {
                    continue;
                }
                $links[] = new ParsedLink(
                    type: 'embed',
                    targetKey: $target,
                    alias: '' !== ($alias ?? '') ? $alias : null,
                    position: $position,
                );
                $occupied[] = [$position, $position + strlen($fullMatch[0])];
            }
        }

        if (preg_match_all(self::PATTERN_WIKILINK, $content, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[0] as $index => $fullMatch) {
                $position = $fullMatch[1];
                if ($this->isOccupied($position, $occupied)) {
                    continue;
                }
                $target = $this->normalizeTargetKey((string) $matches[1][$index][0]);
                $heading = isset($matches[2][$index][0]) ? trim((string) $matches[2][$index][0]) : null;
                $alias = isset($matches[3][$index][0]) ? trim((string) $matches[3][$index][0]) : null;
                if ('' === $target) {
                    continue;
                }
                $links[] = new ParsedLink(
                    type: 'wikilink',
                    targetKey: $target,
                    heading: '' !== ($heading ?? '') ? $heading : null,
                    alias: '' !== ($alias ?? '') ? $alias : null,
                    position: $position,
                );
                $occupied[] = [$position, $position + strlen($fullMatch[0])];
            }
        }

        if (preg_match_all(self::PATTERN_TAG, $content, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[0] as $index => $fullMatch) {
                $position = $fullMatch[1];
                if ($this->isOccupied($position, $occupied)) {
                    continue;
                }
                $target = $this->normalizeTargetKey((string) $matches[1][$index][0]);
                if ('' === $target) {
                    continue;
                }
                $links[] = new ParsedLink(
                    type: 'tag',
                    targetKey: $target,
                    position: $position,
                );
            }
        }

        usort($links, static fn (ParsedLink $a, ParsedLink $b): int => $a->position <=> $b->position);

        return $links;
    }

    public function normalizeTargetKey(string $raw): string
    {
        $trimmed = trim($raw);

        return preg_replace('/\s+/', ' ', $trimmed) ?? $trimmed;
    }

    /**
     * @param list<array{0: int, 1: int}> $occupied
     */
    private function isOccupied(int $position, array $occupied): bool
    {
        foreach ($occupied as [$start, $end]) {
            if ($position >= $start && $position < $end) {
                return true;
            }
        }

        return false;
    }
}
