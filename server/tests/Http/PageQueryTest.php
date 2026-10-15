<?php

namespace App\Tests\Http;

use App\Http\PageQuery;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpFoundation\Request;

final class PageQueryTest extends TestCase
{
    public function testPageSize(): void
    {
        $query = PageQuery::fromRequest(new Request(['page' => '2', 'size' => '10']));

        self::assertSame(2, $query['page']);
        self::assertSame(10, $query['size']);
        self::assertSame(10, $query['offset']);
    }

    public function testLegacyOffset(): void
    {
        $query = PageQuery::fromRequest(new Request(['limit' => '20', 'offset' => '40']));

        self::assertSame(3, $query['page']);
        self::assertSame(40, $query['offset']);
    }
}
