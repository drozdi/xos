<?php

namespace App\Tests\Ssh;

use PHPUnit\Framework\TestCase;
use Ssh\Service\SshConnectionPayload;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class SshConnectionPayloadTest extends TestCase
{
    public function testParsesKeyConnection(): void
    {
        $parsed = SshConnectionPayload::parse([
            'name' => 'Дом',
            'host' => '[::1]',
            'port' => 2200,
            'username' => 'root',
            'auth' => 'key',
            'secret' => "-----BEGIN OPENSSH PRIVATE KEY-----\nabc\n-----END OPENSSH PRIVATE KEY-----",
            'passphrase' => 'phrase',
        ], true);

        self::assertSame('::1', $parsed['host']);
        self::assertSame(2200, $parsed['port']);
        self::assertSame('key', $parsed['auth']);
        self::assertSame('phrase', $parsed['passphrase']);
        self::assertNull($parsed['keyId']);
    }

    public function testKeySelectionDoesNotNeedSecret(): void
    {
        $parsed = SshConnectionPayload::parse([
            'name' => 'Дом',
            'host' => 'example.com',
            'port' => 22,
            'username' => 'root',
            'auth' => 'key',
            'key_id' => 4,
        ], true);

        self::assertSame(4, $parsed['keyId']);
        self::assertNull($parsed['secret']);
    }

    public function testRejectsHostWithSpaces(): void
    {
        $this->expectException(BadRequestHttpException::class);
        SshConnectionPayload::parse([
            'name' => 'Дом',
            'host' => 'bad host',
            'port' => 22,
            'username' => 'root',
            'auth' => 'password',
            'secret' => 'secret',
        ], true);
    }
}
