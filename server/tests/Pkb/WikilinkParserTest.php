<?php

namespace App\Tests\Pkb;

use PHPUnit\Framework\TestCase;
use Pkb\Parser\WikilinkParser;

class WikilinkParserTest extends TestCase
{
    private WikilinkParser $parser;

    protected function setUp(): void
    {
        $this->parser = new WikilinkParser();
    }

    public function testBasicWikilink(): void
    {
        $links = $this->parser->parse('See [[Note]] for details.');
        self::assertCount(1, $links);
        self::assertSame('wikilink', $links[0]->type);
        self::assertSame('Note', $links[0]->targetKey);
        self::assertNull($links[0]->alias);
        self::assertNull($links[0]->heading);
    }

    public function testWikilinkWithAlias(): void
    {
        $links = $this->parser->parse('Click [[Note|Alias]] here.');
        self::assertCount(1, $links);
        self::assertSame('Note', $links[0]->targetKey);
        self::assertSame('Alias', $links[0]->alias);
    }

    public function testWikilinkWithHeading(): void
    {
        $links = $this->parser->parse('Go to [[Note#Heading]] section.');
        self::assertCount(1, $links);
        self::assertSame('Note', $links[0]->targetKey);
        self::assertSame('Heading', $links[0]->heading);
    }

    public function testEmbed(): void
    {
        $links = $this->parser->parse('Image: ![[image.png]]');
        self::assertCount(1, $links);
        self::assertSame('embed', $links[0]->type);
        self::assertSame('image.png', $links[0]->targetKey);
    }

    public function testTag(): void
    {
        $links = $this->parser->parse('Tagged with #project and #area/work');
        self::assertCount(2, $links);
        self::assertSame('tag', $links[0]->type);
        self::assertSame('project', $links[0]->targetKey);
        self::assertSame('area/work', $links[1]->targetKey);
    }

    public function testTagInsideWordDoesNotMatch(): void
    {
        $links = $this->parser->parse('word#tag and #notag');
        self::assertCount(1, $links);
        self::assertSame('notag', $links[0]->targetKey);
    }

    public function testMultipleLinksInDocument(): void
    {
        $content = "# Title\n\nSee [[A]] and [[B|Alias]] with ![[img.png]] and #tag";
        $links = $this->parser->parse($content);
        self::assertCount(4, $links);
        self::assertSame('wikilink', $links[0]->type);
        self::assertSame('A', $links[0]->targetKey);
        self::assertSame('wikilink', $links[1]->type);
        self::assertSame('B', $links[1]->targetKey);
        self::assertSame('embed', $links[2]->type);
        self::assertSame('tag', $links[3]->type);
    }

    public function testEmptyAndMalformed(): void
    {
        self::assertSame([], $this->parser->parse(''));
        self::assertSame([], $this->parser->parse('plain text without links'));
        self::assertSame([], $this->parser->parse('[[]]'));
        self::assertSame([], $this->parser->parse('[Not a wikilink]'));
    }

    public function testNormalizeTargetKeyCollapsesSpaces(): void
    {
        self::assertSame('My Note', $this->parser->normalizeTargetKey('  My   Note  '));
    }
}
