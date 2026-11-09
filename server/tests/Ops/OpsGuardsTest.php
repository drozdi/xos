<?php

namespace App\Tests\Ops;

use Ops\Service\DbStatementGuard;
use Ops\Service\DockerEndpoint;
use Ops\Service\PublicHost;
use Ops\Service\TunnelCommand;
use Ops\Service\TunnelTarget;
use Ops\Service\VncAuth;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class OpsGuardsTest extends TestCase
{
    public function testPublicHostRejectsLoopback(): void
    {
        $this->expectException(BadRequestHttpException::class);
        PublicHost::assert('127.0.0.1');
    }

    public function testPublicHostAllowsPublicIp(): void
    {
        self::assertSame('8.8.8.8', PublicHost::assert('8.8.8.8'));
    }

    public function testStatementMustBeSingle(): void
    {
        self::assertSame('select 1', DbStatementGuard::assert('select 1;'));
        $this->expectException(BadRequestHttpException::class);
        DbStatementGuard::assert('select 1; select 2');
    }

    public function testStatementRejectsServerFiles(): void
    {
        $this->expectException(BadRequestHttpException::class);
        DbStatementGuard::assert("select load_file('/etc/passwd')");
    }

    public function testDockerOrigin(): void
    {
        self::assertSame('https://8.8.8.8:2376', DockerEndpoint::origin('https://8.8.8.8:2376'));
    }

    public function testDockerOriginRejectsPath(): void
    {
        $this->expectException(BadRequestHttpException::class);
        DockerEndpoint::origin('https://8.8.8.8/v1.41');
    }

    public function testTunnelTargetAllowsPrivateRemote(): void
    {
        self::assertSame('10.0.0.8', TunnelTarget::host('10.0.0.8'));
        self::assertSame(15432, TunnelTarget::listenPort(15432));
    }

    public function testTunnelTargetRejectsOption(): void
    {
        $this->expectException(BadRequestHttpException::class);
        TunnelTarget::host('-oProxyCommand');
    }

    public function testTunnelCommandBindsLocally(): void
    {
        $args = TunnelCommand::arguments('ssh', '/tmp/key', '/tmp/known', 15432, '10.0.0.8', 5432, 22, 'root@203.0.113.5');
        self::assertContains('127.0.0.1:15432:10.0.0.8:5432', $args);
        self::assertContains('BatchMode=yes', $args);
        self::assertNotContains('password', $args);
    }

    public function testVncKeyBitReverse(): void
    {
        self::assertSame(0b10000000, VncAuth::reverseByte(0b00000001));
    }
}
