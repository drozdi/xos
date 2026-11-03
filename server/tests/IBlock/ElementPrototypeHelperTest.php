<?php

namespace App\Tests\IBlock;

use IBlock\Entity\Property;
use IBlock\Service\ElementPrototypeHelper;
use PHPUnit\Framework\TestCase;

class ElementPrototypeHelperTest extends TestCase
{
    private ElementPrototypeHelper $helper;

    protected function setUp(): void
    {
        $this->helper = new ElementPrototypeHelper();
    }

    public function testExtractId(): void
    {
        self::assertSame(7, $this->helper->extractId(7));
        self::assertSame(7, $this->helper->extractId('7'));
        self::assertSame(7, $this->helper->extractId(['id' => '7']));
        self::assertNull($this->helper->extractId('x'));
        self::assertNull($this->helper->extractId(['name' => 'a']));
    }

    public function testFieldTypeChecks(): void
    {
        self::assertTrue($this->helper->isListFieldType('L'));
        self::assertTrue($this->helper->isListFieldType('l'));
        self::assertFalse($this->helper->isListFieldType('S'));
        self::assertTrue($this->helper->isPrototypeFieldType('P'));
        self::assertFalse($this->helper->isPrototypeFieldType('E'));
    }

    public function testFieldIsFilled(): void
    {
        self::assertFalse($this->helper->fieldIsFilled(null));
        self::assertFalse($this->helper->fieldIsFilled(''));
        self::assertFalse($this->helper->fieldIsFilled([]));
        self::assertFalse($this->helper->fieldIsFilled([null, '']));
        self::assertTrue($this->helper->fieldIsFilled('x'));
        self::assertTrue($this->helper->fieldIsFilled(['a' => 1]));
        self::assertTrue($this->helper->fieldIsFilled([0, 'ok']));
    }

    public function testTupleHasValue(): void
    {
        $child = $this->createMock(Property::class);
        $child->method('getCode')->willReturn('qty');

        self::assertFalse($this->helper->tupleHasValue(['qty' => ''], [$child]));
        self::assertTrue($this->helper->tupleHasValue(['qty' => 2], [$child]));
    }
}
