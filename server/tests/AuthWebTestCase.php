<?php

namespace App\Tests;

use App\Entity\RefreshToken;
use App\Entity\UserSetting;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\Claimant;
use Main\Entity\User;
use Main\Entity\User\Access as UserAccess;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

abstract class AuthWebTestCase extends WebTestCase
{
    protected const TEST_LOGIN = 'test_user';
    protected const TEST_PASSWORD = 'test_password';
    protected const TEST_EMAIL = 'test@example.com';
    protected const TEST_ALIAS = 'Test User';

    protected function prepareAuthDatabase(KernelBrowser $client): void
    {
        $this->resetAuthSchema($client);
        $this->createTestUser($client);
    }

    protected function resetAuthSchema(KernelBrowser $client): void
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(User::class),
            $entityManager->getClassMetadata(RefreshToken::class),
            $entityManager->getClassMetadata(UserAccess::class),
            $entityManager->getClassMetadata(Claimant::class),
            $entityManager->getClassMetadata(UserSetting::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    protected function createTestUser(KernelBrowser $client, string $login = self::TEST_LOGIN, string $password = self::TEST_PASSWORD): User
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        /** @var UserPasswordHasherInterface $passwordHasher */
        $passwordHasher = $client->getContainer()->get(UserPasswordHasherInterface::class);

        $user = new User();
        $user->setLogin($login);
        $user->setEmail(self::TEST_EMAIL);
        $user->setAlias(self::TEST_ALIAS);
        $user->setRoles([User::ROLE_ADMIN]);
        $user->setPassword($passwordHasher->hashPassword($user, $password));

        $entityManager->persist($user);
        $entityManager->flush();

        return $user;
    }

    /**
     * @return array{token: string, refresh_token: string, user: array<string, mixed>}
     */
    protected function login(KernelBrowser $client, string $login = self::TEST_LOGIN, string $password = self::TEST_PASSWORD): array
    {
        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => $login,
                'password' => $password,
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        /** @var array{token: string, refresh_token: string, user: array<string, mixed>} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return $payload;
    }

    /**
     * @return array<string, string>
     */
    protected function authHeaders(string $token): array
    {
        return [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
