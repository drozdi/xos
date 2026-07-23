<?php

namespace App\Tests\Todo;

use PHPUnit\Framework\TestCase;
use Todo\Entity\TodoList;
use Todo\Service\TodoMarkdownSync;

class TodoMarkdownSyncTest extends TestCase
{
    public function testRoundTrip(): void
    {
        $sync = new TodoMarkdownSync();
        $parsed = $sync->parseMarkdown("- [ ] A | due:2026-07-25 18:00\n- [x] B\n\n---\n\nNote");

        self::assertCount(2, $parsed['items']);
        self::assertFalse($parsed['items'][0]['done']);
        self::assertSame('A', $parsed['items'][0]['text']);
        self::assertInstanceOf(\DateTimeInterface::class, $parsed['items'][0]['due_at']);
        self::assertTrue($parsed['items'][1]['done']);
        self::assertSame('Note', $parsed['notes_md']);

        $list = new TodoList();
        $sync->applyParsedItems($list, $parsed['items']);
        $list->setNotesMd($parsed['notes_md']);

        $md = $sync->itemsToMarkdown($list);
        self::assertStringContainsString('- [ ] A | due:2026-07-25 18:00', $md);
        self::assertStringContainsString('- [x] B', $md);
        self::assertStringContainsString('Note', $md);
    }
}
