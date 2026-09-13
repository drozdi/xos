<?php

namespace App\Tests\Ts;

use PHPUnit\Framework\TestCase;
use Ts\Service\TsTokenCipher;

class TsTokenCipherTest extends TestCase
{
    public function testRoundTripWithSecret(): void
    {
        $cipher = new TsTokenCipher('unit-test-ts-secret');
        $encrypted = $cipher->encrypt('private-token-value');

        self::assertTrue($cipher->isEncrypted($encrypted));
        self::assertSame('private-token-value', $cipher->decrypt($encrypted));
    }

    public function testPlaintextWithoutSecret(): void
    {
        $cipher = new TsTokenCipher(null);
        self::assertSame('plain', $cipher->encrypt('plain'));
        self::assertSame('plain', $cipher->decrypt('plain'));
    }
}
