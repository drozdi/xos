<?php

namespace App\Tests\Samba;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Samba\Entity\SambaServer;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class SambaAgentBundleApiTest extends AuthWebTestCase
{
    public function testBundleAcceptsHttpBasicAuth(): void
    {
        $client = static::createClient();
        $owner = $this->prepareSambaFixture($client);
        $server = $this->createSambaServer($client, $owner);

        $client->request(
            'POST',
            '/api/samba/agent/bundle',
            [],
            [],
            [
                'PHP_AUTH_USER' => self::TEST_LOGIN,
                'PHP_AUTH_PW' => self::TEST_PASSWORD,
                'CONTENT_TYPE' => 'application/json',
            ],
            json_encode(['server_id' => $server->getId()], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();
        self::assertSame('application/zip', $client->getResponse()->headers->get('Content-Type'));
        self::assertStringStartsWith('PK', $client->getResponse()->getContent());
    }

    public function testBundleRejectsMissingCredentials(): void
    {
        $client = static::createClient();
        $owner = $this->prepareSambaFixture($client);
        $server = $this->createSambaServer($client, $owner);

        $client->request(
            'POST',
            '/api/samba/agent/bundle',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['server_id' => $server->getId()], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(401);
    }

    private function prepareSambaFixture(KernelBrowser $client): User
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            ...$this->authMetadata($entityManager),
            $entityManager->getClassMetadata(SambaServer::class),
            $entityManager->getClassMetadata(\Samba\Entity\SambaEnrollment::class),
            $entityManager->getClassMetadata(\Main\Entity\AuditLog::class),
        ];
        $this->resetMetadataSchema($entityManager, $metadata);

        return $this->createTestUser($client, self::TEST_LOGIN, self::TEST_PASSWORD, [User::ROLE_USER, 'ROLE_SAMBA']);
    }

    private function createSambaServer(KernelBrowser $client, User $owner): SambaServer
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $server = new SambaServer($owner);
        $server->setName('dc-test');
        $entityManager->persist($server);
        $entityManager->flush();

        return $server;
    }

    /**
     * @return list<\Doctrine\ORM\Mapping\ClassMetadata>
     */
    private function authMetadata(EntityManagerInterface $entityManager): array
    {
        return [
            $entityManager->getClassMetadata(User::class),
            $entityManager->getClassMetadata(\Main\Entity\OU::class),
            $entityManager->getClassMetadata(\Main\Entity\Group::class),
            $entityManager->getClassMetadata(\Main\Entity\User\Group::class),
            $entityManager->getClassMetadata(\App\Entity\RefreshToken::class),
            $entityManager->getClassMetadata(\Main\Entity\User\Access::class),
            $entityManager->getClassMetadata(\Main\Entity\Claimant::class),
            $entityManager->getClassMetadata(\App\Entity\UserSetting::class),
            $entityManager->getClassMetadata(\App\Entity\UserAppData::class),
        ];
    }
}