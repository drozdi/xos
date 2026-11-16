<?php

namespace App\Tests\Rdp;

use PHPUnit\Framework\TestCase;
use Rdp\Service\CidrMatcher;
use Rdp\Service\RdpAccessDecision;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

class RdpAccessDecisionTest extends TestCase
{
    public function testPublicAddress(): void
    {
        $decision = RdpAccessDecision::decide(['8.8.8.8'], false, 'auto', []);

        self::assertSame('public', $decision['zone']);
        self::assertSame('8.8.8.8', $decision['resolved_ip']);
        self::assertNull($decision['network_id']);
    }

    public function testPublicAddressRejectsInternalZone(): void
    {
        $this->expectException(BadRequestHttpException::class);
        RdpAccessDecision::decide(['8.8.8.8'], false, 'internal', []);
    }

    public function testPrivateAddressNeedsGrant(): void
    {
        $this->expectException(BadRequestHttpException::class);
        RdpAccessDecision::decide(['10.1.2.3'], false, 'auto', []);
    }

    public function testPrivateAddressUsesLongestPrefix(): void
    {
        $decision = RdpAccessDecision::decide(['10.1.2.3'], false, 'auto', [
            ['id' => 1, 'name' => 'Широкая', 'cidrs' => ['10.0.0.0/8']],
            ['id' => 2, 'name' => 'Офис', 'cidrs' => ['10.1.0.0/16']],
        ]);

        self::assertSame('internal', $decision['zone']);
        self::assertSame(2, $decision['network_id']);
        self::assertSame('Офис', $decision['network_name']);
    }

    public function testMappedIpv6UsesGrant(): void
    {
        $decision = RdpAccessDecision::decide(['::ffff:10.0.0.5'], false, 'internal', [
            ['id' => 4, 'name' => 'Офис', 'cidrs' => ['10.0.0.0/8']],
        ]);

        self::assertSame('10.0.0.5', $decision['resolved_ip']);
        self::assertSame(4, $decision['network_id']);
    }

    public function testMixedAddressesAreRejected(): void
    {
        $this->expectException(BadRequestHttpException::class);
        RdpAccessDecision::decide(['8.8.8.8', '10.0.0.5'], false, 'auto', [
            ['id' => 1, 'name' => 'Офис', 'cidrs' => ['10.0.0.0/8']],
        ]);
    }

    public function testLoopbackLinkLocalAndUnspecifiedAreDenied(): void
    {
        foreach (['127.0.0.1', '0.0.0.0', '169.254.169.254', '::1'] as $ip) {
            try {
                RdpAccessDecision::decide([$ip], false, 'auto', []);
                self::fail($ip.' should be denied');
            } catch (BadRequestHttpException) {
                self::assertTrue(true);
            }
        }
    }

    public function testInternalNameWithoutGrantIsDenied(): void
    {
        $this->expectException(BadRequestHttpException::class);
        RdpAccessDecision::decide(['8.8.8.8'], true, 'auto', []);
    }

    public function testCidrRejectsTooWideAndServiceRanges(): void
    {
        self::assertSame('10.1.0.0/16', CidrMatcher::assertCidr('10.1.0.0/16'));
        $this->expectException(BadRequestHttpException::class);
        CidrMatcher::assertCidr('0.0.0.0/0');
    }

    public function testServiceRangeOverlapsDenyList(): void
    {
        $this->expectException(BadRequestHttpException::class);
        CidrMatcher::assertCidr('127.0.0.0/8');
    }
}
