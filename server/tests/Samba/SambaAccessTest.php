<?php

namespace App\Tests\Samba;

use Main\Entity\User;
use PHPUnit\Framework\TestCase;
use Samba\Entity\SambaServer;
use Samba\Repository\SambaServerRepository;
use Samba\Service\SambaGuard;
use Samba\Service\SambaRights;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class SambaAccessTest extends TestCase
{
    public function testLogRightCannotBeGranted(): void
    {
        $this->expectException(BadRequestHttpException::class);
        SambaRights::parse(['view', 'log']);
    }

    public function testOwnerSeesLogAndReaderDoesNot(): void
    {
        $owner = new User();
        $reader = new User();
        $server = new SambaServer($owner);

        self::assertTrue(SambaGuard::isOwner($owner, $server));
        self::assertFalse(SambaGuard::isOwner($reader, $server));
    }

    public function testOwnerWithServersCannotBeDeleted(): void
    {
        $servers = $this->createMock(SambaServerRepository::class);
        $servers->method('countOwned')->willReturn(1);
        $guard = new SambaGuard($servers);

        $this->expectException(ConflictHttpException::class);
        $this->expectExceptionMessage('Сначала передайте серверы');
        $guard->assertDeletable(new User());
    }

    public function testUserWithoutServersCanBeDeleted(): void
    {
        $servers = $this->createMock(SambaServerRepository::class);
        $servers->method('countOwned')->willReturn(0);
        $guard = new SambaGuard($servers);

        $guard->assertDeletable(new User());
        self::assertTrue(true);
    }
}
