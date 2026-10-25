<?php

namespace App\Tests\Ssh;

use PHPUnit\Framework\TestCase;
use Ssh\Service\SshSecretCipher;

class SshSecretCipherTest extends TestCase
{
    public function testRoundTripKeepsKeyNewlines(): void
    {
        $cipher = new SshSecretCipher('unit-test-ssh-secret');
        $secret = "-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----\n";
        $encrypted = $cipher->encrypt($secret);

        self::assertStringStartsWith('enc:v1:', $encrypted);
        self::assertSame($secret, $cipher->decrypt($encrypted));
    }
}
