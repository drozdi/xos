<?php

namespace App\Tests\Ssh;

use PHPUnit\Framework\TestCase;
use Ssh\Service\SshKeyFactory;

class SshKeyFactoryTest extends TestCase
{
    public function testGeneratesEd25519Pair(): void
    {
        $factory = new SshKeyFactory();
        $material = $factory->generate('ed25519', null, 'laptop');

        self::assertSame('ed25519', $material['type']);
        self::assertStringStartsWith('ssh-ed25519 ', $material['public']);
        self::assertStringContainsString('laptop', $material['public']);
        self::assertStringContainsString('PRIVATE KEY', $material['private']);
        self::assertStringStartsWith('SHA256:', $material['fingerprint']);
    }

    public function testImportRoundTrip(): void
    {
        $factory = new SshKeyFactory();
        $generated = $factory->generate('ed25519', 'phrase', 'laptop');
        $imported = $factory->import($generated['private'], 'phrase', 'laptop');

        self::assertSame($generated['fingerprint'], $imported['fingerprint']);
        self::assertStringStartsWith('ssh-ed25519 ', $imported['public']);
    }
}
