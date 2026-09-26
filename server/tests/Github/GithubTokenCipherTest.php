<?php

namespace App\Tests\Github;

use Github\Service\GithubTokenCipher;
use PHPUnit\Framework\TestCase;

class GithubTokenCipherTest extends TestCase
{
    public function testRoundTripWithSecret(): void
    {
        $cipher = new GithubTokenCipher('unit-test-github-secret');
        $encrypted = $cipher->encrypt('ghp_token_value');

        self::assertTrue($cipher->isEncrypted($encrypted));
        self::assertSame('ghp_token_value', $cipher->decrypt($encrypted));
    }

    public function testPlaintextWithoutSecret(): void
    {
        $cipher = new GithubTokenCipher(null);
        self::assertSame('plain', $cipher->encrypt('plain'));
        self::assertSame('plain', $cipher->decrypt('plain'));
    }
}
