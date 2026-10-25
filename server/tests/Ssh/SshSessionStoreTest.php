<?php

namespace App\Tests\Ssh;

use PHPUnit\Framework\TestCase;
use Ssh\Service\SshSessionStore;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class SshSessionStoreTest extends TestCase
{
    public function testInputIsConsumedOnceAndCloseHidesSession(): void
    {
        $root = sys_get_temp_dir().'/xos-ssh-'.bin2hex(random_bytes(4));
        mkdir($root);
        $store = new SshSessionStore($root);

        $meta = $store->create(7, 3, 100, 40);
        $store->appendInput(7, $meta['id'], "ls\n");

        self::assertSame("ls\n", $store->consumeInput($meta['id']));
        self::assertSame('', $store->consumeInput($meta['id']));

        $store->close(7, $meta['id']);
        self::assertTrue($store->isClosed($meta['id']));

        $store->destroy($meta['id']);
        $this->expectException(NotFoundHttpException::class);
        $store->requireForUser(7, $meta['id']);
    }
}
