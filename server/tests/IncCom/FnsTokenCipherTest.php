<?php

namespace App\Tests\IncCom;

use IncCom\Service\FnsTokenCipher;
use PHPUnit\Framework\TestCase;

class FnsTokenCipherTest extends TestCase
{
    public function testRoundTripWithSecret(): void
    {
        $cipher = new FnsTokenCipher('unit-test-secret-key');
        $encrypted = $cipher->encrypt('master-token-value');

        self::assertTrue($cipher->isEncrypted($encrypted));
        self::assertStringStartsWith('enc:v1:', $encrypted);
        self::assertSame('master-token-value', $cipher->decrypt($encrypted));
    }

    public function testPlaintextPassthroughWithoutSecret(): void
    {
        $cipher = new FnsTokenCipher(null);
        self::assertFalse($cipher->isEnabled());
        self::assertSame('plain-token', $cipher->encrypt('plain-token'));
        self::assertSame('plain-token', $cipher->decrypt('plain-token'));
    }

    public function testLegacyPlaintextReadableWithSecret(): void
    {
        $cipher = new FnsTokenCipher('unit-test-secret-key');
        self::assertSame('legacy-token', $cipher->decrypt('legacy-token'));
    }

    public function testDecryptFailsWithoutSecretForCiphertext(): void
    {
        $encrypted = (new FnsTokenCipher('unit-test-secret-key'))->encrypt('secret');
        $this->expectException(\RuntimeException::class);
        (new FnsTokenCipher(''))->decrypt($encrypted);
    }
}
