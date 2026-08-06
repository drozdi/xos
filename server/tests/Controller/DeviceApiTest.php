<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Device\Entity\Accounting;
use Device\Entity\Device;
use Device\Entity\Device\Location;
use Device\Entity\Type;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\Claimant;
use Main\Entity\File;
use Main\Entity\User;
use Main\Entity\User\Access as UserAccess;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class DeviceApiTest extends AuthWebTestCase
{
    private const SCOPE_READ = 2;

    public function testDeviceListRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/device/device/list',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['limit' => -1, 'offset' => 1], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(401);
    }

    public function testDeviceListForbiddenWithoutScope(): void
    {
        $client = static::createClient();
        $this->prepareDeviceDatabase($client);
        $this->createTestUser($client, 'device_plain', 'plain_password', ['ROLE_USER']);
        $loginPayload = $this->login($client, 'device_plain', 'plain_password');

        $client->request(
            'POST',
            '/api/device/device/list',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode(['limit' => -1, 'offset' => 1], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(403);
    }

    public function testDeviceListAllowedWithCanReadScope(): void
    {
        $client = static::createClient();
        $this->prepareDeviceDatabase($client);
        $user = $this->createTestUser($client, 'device_reader', 'read_password', ['ROLE_USER', 'ROLE_DEVICE']);
        $this->grantDeviceScope($client, $user, 'device.device', self::SCOPE_READ);
        $loginPayload = $this->login($client, 'device_reader', 'read_password');

        $client->request(
            'POST',
            '/api/device/device/list',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode(['limit' => -1, 'offset' => 1], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();
        self::assertResponseHeaderSame('Content-Range', 'items 0--1/0');
    }

    protected function prepareDeviceDatabase(KernelBrowser $client): void
    {
        $this->prepareAuthDatabase($client);

        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(File::class),
            $entityManager->getClassMetadata(Type::class),
            $entityManager->getClassMetadata(Accounting::class),
            $entityManager->getClassMetadata(Device::class),
            $entityManager->getClassMetadata(Location::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    protected function grantDeviceScope(
        KernelBrowser $client,
        User $user,
        string $code,
        int $level,
    ): void {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);

        $claimant = new Claimant();
        $claimant->setCode($code);
        $claimant->setName($code);

        $access = new UserAccess();
        $access->setUser($user);
        $access->setClaimant($claimant);
        $access->setLevel($level);

        $entityManager->persist($claimant);
        $entityManager->persist($access);
        $entityManager->flush();
    }
}
