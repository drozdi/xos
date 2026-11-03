<?php

namespace App\Tests\SchoolTask;

use PHPUnit\Framework\TestCase;
use SchoolTask\Service\SchoolTaskTransliterator;

class SchoolTaskTransliteratorTest extends TestCase
{
    public function testTranslitMapsCyrillicAndSanitizes(): void
    {
        $slugger = new SchoolTaskTransliterator();

        self::assertSame('klass_a', $slugger->translit(' Класс А '));
        self::assertSame('schuka', $slugger->translit('Щука'));
        self::assertSame('item', $slugger->translit('!!!'));
        self::assertSame('math_10', $slugger->translit('Math 10'));
    }
}
