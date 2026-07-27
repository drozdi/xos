<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class DualAuthApiTest extends AuthWebTestCase
{
    public function testDesktopLoginByLoginOnly(): void
    {
        $client = static::createClient();
        $this->prepareDualAuthDatabase($client);

        $user = $this->createTestUser($client, 'desk_user', 'password', ['ROLE_USER']);
        $user->setEmail('desk@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'desk_user', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'desk@example.com', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(401);
    }

    public function testAppLoginByEmailOnly(): void
    {
        $client = static::createClient();
        $this->prepareDualAuthDatabase($client);

        $user = $this->createTestUser($client, 'app_user', 'password', ['ROLE_USER', 'ROLE_INCCOM']);
        $user->setEmail('app@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $client->request(
            'POST',
            '/api/IncCom/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'app@example.com', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        /** @var array{token: string} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($payload['token']);

        $client->request(
            'POST',
            '/api/IncCom/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'app_user', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(401);
    }

    public function testAppLoginRequiresInccomAccess(): void
    {
        $client = static::createClient();
        $this->prepareDualAuthDatabase($client);

        $user = $this->createTestUser($client, 'no_inccom', 'password', ['ROLE_USER']);
        $user->setEmail('no-inccom@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $client->request(
            'POST',
            '/api/IncCom/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'no-inccom@example.com', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(401);
    }

    public function testSchooltaskLoginByEmailRequiresAccess(): void
    {
        $client = static::createClient();
        $this->prepareDualAuthDatabase($client);

        $allowed = $this->createTestUser($client, 'st_user', 'password', ['ROLE_USER', 'ROLE_SCHOOLTASK']);
        $allowed->setEmail('school@example.com');
        $denied = $this->createTestUser($client, 'no_st', 'password', ['ROLE_USER']);
        $denied->setEmail('no-school@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $client->request(
            'POST',
            '/api/schooltask/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'school@example.com', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/schooltask/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'no-school@example.com', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(401);
    }

    public function testCalendarLoginByEmailForAnyUser(): void
    {
        $client = static::createClient();
        $this->prepareDualAuthDatabase($client);

        $user = $this->createTestUser($client, 'cal_user', 'password', ['ROLE_USER']);
        $user->setEmail('calendar@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $client->request(
            'POST',
            '/api/calendar/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'calendar@example.com', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        /** @var array{token: string} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($payload['token']);

        $client->request(
            'POST',
            '/api/calendar/auth/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['username' => 'cal_user', 'password' => 'password'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(401);
    }

    private function prepareDualAuthDatabase(KernelBrowser $client): void
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(User::class),
            $entityManager->getClassMetadata(\App\Entity\RefreshToken::class),
            $entityManager->getClassMetadata(\Main\Entity\User\Access::class),
            $entityManager->getClassMetadata(\Main\Entity\Claimant::class),
            $entityManager->getClassMetadata(\App\Entity\UserSetting::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }
}
