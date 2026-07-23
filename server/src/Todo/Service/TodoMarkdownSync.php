<?php

namespace Todo\Service;

use Todo\Entity\TodoItem;
use Todo\Entity\TodoList;

/**
 * Синхронизация чеклиста ↔ Markdown.
 *
 * Формат строки дела:
 * - [ ] Текст | due:2026-07-25 18:00
 * - [x] Готово
 *
 * Заметки списка — отдельно в notes_md; в полном MD идут после разделителя ---.
 */
final class TodoMarkdownSync
{
    public function itemsToMarkdown(TodoList $list): string
    {
        $lines = [];
        foreach ($list->getItems() as $item) {
            $mark = $item->isDone() ? 'x' : ' ';
            $line = sprintf('- [%s] %s', $mark, $item->getText());
            $due = $item->getDueAt('Y-m-d H:i');
            if (null !== $due && '' !== $due) {
                $line .= ' | due:'.$due;
            }
            $lines[] = $line;
        }

        $body = implode("\n", $lines);
        $notes = trim((string) $list->getNotesMd());
        if ('' !== $notes) {
            $body = ('' !== $body ? $body."\n\n---\n\n" : '').$notes;
        }

        return $body;
    }

    /**
     * @return array{items: list<array{text: string, done: bool, due_at: ?\DateTimeInterface, position: int}>, notes_md: ?string}
     */
    public function parseMarkdown(string $markdown): array
    {
        $parts = preg_split('/^\s*---\s*$/m', $markdown, 2) ?: [$markdown];
        $checklistPart = $parts[0] ?? '';
        $notes = isset($parts[1]) ? trim($parts[1]) : null;
        if ('' === $notes) {
            $notes = null;
        }

        $items = [];
        $position = 0;
        foreach (preg_split("/\r\n|\n|\r/", $checklistPart) ?: [] as $rawLine) {
            $line = trim($rawLine);
            if ('' === $line) {
                continue;
            }
            if (!preg_match('/^[-*]\s+\[([ xX])\]\s+(.+)$/u', $line, $m)) {
                continue;
            }
            $done = 'x' === strtolower($m[1]);
            $rest = trim($m[2]);
            $dueAt = null;
            if (preg_match('/^(.*?)\s*\|\s*due:\s*(.+)$/iu', $rest, $dm)) {
                $rest = trim($dm[1]);
                $dueAt = $this->parseDue($dm[2]);
            }
            if ('' === $rest) {
                continue;
            }
            $items[] = [
                'text' => $rest,
                'done' => $done,
                'due_at' => $dueAt,
                'position' => $position++,
            ];
        }

        return ['items' => $items, 'notes_md' => $notes];
    }

    public function applyParsedItems(TodoList $list, array $parsedItems): void
    {
        foreach ($list->getItems()->toArray() as $existing) {
            $list->removeItem($existing);
        }

        foreach ($parsedItems as $row) {
            $item = new TodoItem();
            $item->setText((string) $row['text']);
            $item->setDone((bool) $row['done']);
            $item->setDueAt($row['due_at'] instanceof \DateTimeInterface ? $row['due_at'] : null);
            $item->setPosition((int) $row['position']);
            $list->addItem($item);
        }
    }

    private function parseDue(string $value): ?\DateTimeInterface
    {
        $value = trim($value);
        foreach (['Y-m-d H:i:s', 'Y-m-d H:i', 'Y-m-d\TH:i:s', 'Y-m-d\TH:i', 'Y-m-d'] as $format) {
            $dt = \DateTime::createFromFormat($format, $value);
            if (false !== $dt) {
                return $dt;
            }
        }

        try {
            return new \DateTime($value);
        } catch (\Exception) {
            return null;
        }
    }
}
