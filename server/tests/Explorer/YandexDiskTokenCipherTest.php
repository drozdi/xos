<?php

namespace App\Tests\Explorer;

use Explorer\Service\YandexDiskTokenCipher;
use PHPUnit\Framework\TestCase;

class YandexDiskTokenCipherTest extends TestCase
{
    public function testRoundTripWithSecret(): void
    {
        $cipher = new YandexDiskTokenCipher('unit-test-yandex-secret');
        $encrypted = $cipher->encrypt('yandex_oauth_token');

        self::assertTrue($cipher->isEncrypted($encrypted));
        self::assertSame('yandex_oauth_token', $cipher->decrypt($encrypted));
    }

    public function testPlaintextWithoutSecret(): void
    {
        $cipher = new YandexDiskTokenCipher(null);
        self::assertSame('plain', $cipher->encrypt('plain'));
        self::assertSame('plain', $cipher->decrypt('plain'));
    }
}
