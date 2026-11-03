<?php

namespace App\Tests\Unit\Http;

use App\Http\ListRequest;
use PHPUnit\Framework\TestCase;

final class ListRequestTest extends TestCase
{
    public function testClampsNegativeLimitToDefaultRange(): void
    {
        $req = ListRequest::merge(
            ['limit' => 20, 'offset' => 1, 'filters' => ['parent' => null]],
            ['limit' => -1, 'filters' => ['parent' => 5]],
        );

        self::assertSame(20, $req['limit']);
        self::assertSame(1, $req['offset']);
        self::assertSame(['parent' => 5], $req['filters']);
    }

    public function testClampsLimitAboveHundred(): void
    {
        $req = ListRequest::merge(
            ['limit' => 20, 'offset' => 1],
            ['limit' => 500, 'offset' => 0],
        );

        self::assertSame(100, $req['limit']);
        self::assertSame(1, $req['offset']);
    }
}
