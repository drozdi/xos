<?php

namespace App\Tests\Pkb;

use PHPUnit\Framework\TestCase;
use Pkb\Service\PkbBodyCipher;

class PkbBodyCipherTest extends TestCase
{
    public function testEncryptDecryptRoundTrip(): void
    {
        $cipher = new PkbBodyCipher('unit-test-pkb-secret');
        $encrypted = $cipher->encrypt('hello note body');

        self::assertTrue($cipher->isEncrypted($encrypted));
        self::assertSame('hello note body', $cipher->decrypt($encrypted));
    }

    public function testWithoutSecretStoresPlaintext(): void
    {
        $cipher = new PkbBodyCipher(null);
        self::assertFalse($cipher->isEnabled());
        self::assertSame('plain', $cipher->encrypt('plain'));
    }

    public function testDecryptRequiresSecret(): void
    {
        $encrypted = (new PkbBodyCipher('unit-test-pkb-secret'))->encrypt('secret');

        $this->expectException(\RuntimeException::class);
        (new PkbBodyCipher(''))->decrypt($encrypted);
    }
}
