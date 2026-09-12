<?php

namespace App\Tests\IncCom;

use IncCom\Service\ReceiptJsonParser;
use PHPUnit\Framework\TestCase;

class ReceiptJsonParserTest extends TestCase
{
    public function testExtractsItemsFromTicketContent(): void
    {
        $parser = new ReceiptJsonParser();
        $items = $parser->extractItems([
            'ticket' => [
                'content' => [
                    'items' => [
                        ['name' => 'Хлеб', 'quantity' => 2, 'price' => 4500, 'sum' => 9000],
                        ['name' => 'Молоко', 'quantity' => 1, 'sum' => 8900],
                    ],
                ],
            ],
        ]);

        self::assertCount(2, $items);
        self::assertSame('Хлеб', $items[0]['name']);
        self::assertSame('2.000', $items[0]['quantity']);
        self::assertSame('45.00', $items[0]['price']);
        self::assertSame('Молоко', $items[1]['name']);
        self::assertSame('89.00', $items[1]['price']);
    }

    public function testAcceptsRubleFloatPrice(): void
    {
        $parser = new ReceiptJsonParser();
        $items = $parser->extractItems([
            'items' => [
                ['name' => 'Кофе', 'qty' => 1, 'price' => 199.5],
            ],
        ]);

        self::assertCount(1, $items);
        self::assertSame('199.50', $items[0]['price']);
    }

    public function testEmptyWhenNoItems(): void
    {
        $parser = new ReceiptJsonParser();
        self::assertSame([], $parser->extractItems(['ticket' => ['total' => 100]]));
    }
}
