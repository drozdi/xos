<?php

namespace App\Tests\Samba;

use PHPUnit\Framework\TestCase;
use Samba\Service\ZipStore;

class ZipStoreTest extends TestCase
{
    public function testStoresSettingsAndCertificateUncompressed(): void
    {
        $zip = new ZipStore();
        $settings = "[xos]\nurl = https://xos.example\nserver_id = 7\nenroll_token = abc\nca_file = /etc/xos-agent/ca.pem\n";
        $certificate = "-----BEGIN CERTIFICATE-----\nMIIB\n-----END CERTIFICATE-----\n";
        $zip->add('agent.ini', $settings);
        $zip->add('ca.pem', $certificate);
        $zip->add('install.sh', "#!/bin/sh\n");
        $binary = $zip->binary();

        self::assertStringStartsWith("PK\x03\x04", $binary);
        self::assertStringContainsString('agent.ini', $binary);
        self::assertStringContainsString($settings, $binary);
        self::assertStringContainsString($certificate, $binary);
    }
}
