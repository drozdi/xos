<?php

namespace App\Tests\Board;

use Board\Entity\Board;
use Board\Enum\MemberRole;
use Board\Service\BoardInputNormalizer;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class BoardInputNormalizerTest extends TestCase
{
    private BoardInputNormalizer $normalizer;

    protected function setUp(): void
    {
        $this->normalizer = new BoardInputNormalizer();
    }

    public function testNormalizeNameAndTitleFallback(): void
    {
        self::assertSame('Без названия', $this->normalizer->normalizeName(null));
        self::assertSame('Без названия', $this->normalizer->normalizeName('  '));
        self::assertSame('Alpha', $this->normalizer->normalizeName(' Alpha '));
        self::assertSame('Без названия', $this->normalizer->normalizeTitle(''));
        self::assertSame('Board', $this->normalizer->normalizeTitle('Board'));
    }

    public function testNormalizeNullableText(): void
    {
        self::assertNull($this->normalizer->normalizeNullableText(null));
        self::assertNull($this->normalizer->normalizeNullableText('  '));
        self::assertSame('hi', $this->normalizer->normalizeNullableText(' hi '));
    }

    public function testParseFilterDate(): void
    {
        self::assertNull($this->normalizer->parseFilterDate(null));
        self::assertNull($this->normalizer->parseFilterDate(''));
        $date = $this->normalizer->parseFilterDate('2026-08-01');
        self::assertInstanceOf(\DateTimeInterface::class, $date);
        self::assertSame('2026-08-01', $date->format('Y-m-d'));

        $this->expectException(BadRequestHttpException::class);
        $this->normalizer->parseFilterDate('not-a-date');
    }

    public function testNormalizeBackgroundAndVisibility(): void
    {
        self::assertSame(Board::BACKGROUND_COLOR, $this->normalizer->normalizeBackgroundType('Color'));
        self::assertSame(Board::VISIBILITY_PRIVATE, $this->normalizer->normalizeVisibility('PRIVATE'));

        try {
            $this->normalizer->normalizeBackgroundType('neon');
            self::fail('expected BadRequestHttpException');
        } catch (BadRequestHttpException) {
        }

        $this->expectException(BadRequestHttpException::class);
        $this->normalizer->normalizeVisibility('public');
    }

    public function testParseMemberRole(): void
    {
        self::assertSame(MemberRole::Editor, $this->normalizer->parseMemberRole('editor'));

        $this->expectException(BadRequestHttpException::class);
        $this->normalizer->parseMemberRole('owner');
    }

    public function testLabelChecklistAndCommentNormalization(): void
    {
        self::assertSame('Bug', $this->normalizer->normalizeLabelName(' Bug '));
        self::assertSame('#ff0', $this->normalizer->normalizeLabelColor('#ff0'));
        self::assertSame('Todo', $this->normalizer->normalizeChecklistTitle('Todo'));
        self::assertSame('Item', $this->normalizer->normalizeChecklistItemText('Item'));
        self::assertSame('Hi', $this->normalizer->normalizeCommentText('Hi'));

        $this->expectException(BadRequestHttpException::class);
        $this->normalizer->normalizeLabelName('  ');
    }

    public function testParseAndFormatDateTime(): void
    {
        self::assertNull($this->normalizer->parseNullableDateTime(null));
        self::assertNull($this->normalizer->parseNullableDateTime(''));
        $parsed = $this->normalizer->parseNullableDateTime('2026-11-03 12:00:00');
        self::assertInstanceOf(\DateTimeInterface::class, $parsed);
        self::assertSame('2026-11-03T12:00:00', $this->normalizer->formatDateTime($parsed));
        self::assertNull($this->normalizer->formatDateTime(null));

        $this->expectException(BadRequestHttpException::class);
        $this->normalizer->parseNullableDateTime('bad');
    }
}
