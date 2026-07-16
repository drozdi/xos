<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Main\Entity\Claimant;
use Main\Entity\OU;
use Main\Entity\User;
use Main\Entity\User\Access as UserAccess;

class MainOuApiTest extends AuthWebTestCase
{
    public function testOuListForbiddenWithoutPermission(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);
        $this->createTestUser($client, 'main_user', 'main_password', ['ROLE_MAIN']);
        $loginPayload = $this->login($client, 'main_user', 'main_password');

        $client->request(
            'POST',
            '/api/main/ou/list',
            [],
            [],
            array_merge($this->authHeaders($loginPayload['token']), [
                'CONTENT_TYPE' => 'application/json',
            ]),
            json_encode(['t' => 'list', 'limit' => 20, 'offset'  => 1], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(403);

        /** @var array{message: string} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Нет прав на просмотр подразделений', $payload['message']);
    }

    public function testOuListAllowedWithCanReadScope(): void
    {
        $client = static::createClient();
        $this->prepareOuDatabase($client);
        $user = $this->createTestUser($client, 'read_user', 'read_password', ['ROLE_MAIN']);
        $this->grantUserScope($client, $user, 'main.ou', 2);
        $loginPayload = $this->login($client, 'read_user', 'read_password');

        $client->request(
            'POST',
            '/api/main/ou/list',
            [],
            [],
            array_merge($this->authHeaders($loginPayload['token']), [
                'CONTENT_TYPE' => 'application/json',
            ]),
            json_encode(['t' => 'list', 'limit' => 20, 'offset' => 1], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();
    }

    public function testOuUpdateForbiddenWithoutPermission(): void
    {
        $client = static::createClient();
        $this->prepareOuDatabase($client);
        $user = $this->createTestUser($client, 'read_only', 'read_password', ['ROLE_MAIN']);
        $this->grantUserScope($client, $user, 'main.ou', 2);
        $loginPayload = $this->login($client, 'read_only', 'read_password');

        $client->request(
            'PUT',
            '/api/main/ou/1',
            [],
            [],
            array_merge($this->authHeaders($loginPayload['token']), [
                'CONTENT_TYPE' => 'application/json',
            ]),
            json_encode([
                'code' => 'updated',
                'name' => 'Updated',
                'user_id' => $user->getId(),
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(403);
    }

    public function testOuDeleteForbiddenWithoutPermission(): void
    {
        $client = static::createClient();
        $this->prepareOuDatabase($client);
        $user = $this->createTestUser($client, 'update_only', 'update_password', ['ROLE_MAIN']);
        $this->grantUserScope($client, $user, 'main.ou', 4);
        $loginPayload = $this->login($client, 'update_only', 'update_password');

        $client->request(
            'DELETE',
            '/api/main/ou/1',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
        );

        self::assertResponseStatusCodeSame(403);
    }

    public function testOuCreateRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/main/ou/',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'id' => 0,
                'code' => 'test-ou',
                'name' => 'Test OU',
                'user_id' => 1,
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(401);
    }

    public function testOuCreateForbiddenWithoutPermission(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);
        $admin = $this->createTestUser($client, 'main_user', 'main_password', ['ROLE_MAIN']);
        $loginPayload = $this->login($client, 'main_user', 'main_password');

        $client->request(
            'POST',
            '/api/main/ou/',
            [],
            [],
            array_merge($this->authHeaders($loginPayload['token']), [
                'CONTENT_TYPE' => 'application/json',
            ]),
            json_encode([
                'id' => 0,
                'code' => 'test-ou',
                'name' => 'Test OU',
                'user_id' => $admin->getId(),
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(403);
    }

    public function testOuCreateAllowedForMainOuRoot(): void
    {
        $client = static::createClient();
        $this->prepareOuDatabase($client);
        $admin = $this->createTestUser($client, 'ou_root', 'ou_password', ['ROLE_MAIN_OU_ROOT']);
        $loginPayload = $this->login($client, 'ou_root', 'ou_password');

        $client->request(
            'POST',
            '/api/main/ou/',
            [],
            [],
            array_merge($this->authHeaders($loginPayload['token']), [
                'CONTENT_TYPE' => 'application/json',
            ]),
            json_encode([
                'id' => 0,
                'code' => 'new-ou',
                'name' => 'New OU',
                'user_id' => $admin->getId(),
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(201);
    }

    public function testOuCreateAllowedWithCanCreateScope(): void
    {
        $client = static::createClient();
        $this->prepareOuDatabase($client);
        $user = $this->createTestUser($client, 'scoped_user', 'scoped_password', ['ROLE_MAIN']);
        $this->grantUserScope($client, $user, 'main.ou', 1);
        $loginPayload = $this->login($client, 'scoped_user', 'scoped_password');

        $client->request(
            'POST',
            '/api/main/ou/',
            [],
            [],
            array_merge($this->authHeaders($loginPayload['token']), [
                'CONTENT_TYPE' => 'application/json',
            ]),
            json_encode([
                'id' => 0,
                'code' => 'scoped-ou',
                'name' => 'Scoped OU',
                'user_id' => $user->getId(),
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(201);
    }

    protected function prepareOuDatabase(\Symfony\Bundle\FrameworkBundle\KernelBrowser $client): void
    {
        $this->prepareAuthDatabase($client);

        /** @var \Doctrine\ORM\EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(\Doctrine\ORM\EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(OU::class),
        ];

        $schemaTool = new \Doctrine\ORM\Tools\SchemaTool($entityManager);
        $schemaTool->createSchema($metadata);
    }

    protected function grantUserScope(
        \Symfony\Bundle\FrameworkBundle\KernelBrowser $client,
        User $user,
        string $code,
        int $level,
    ): void {
        /** @var \Doctrine\ORM\EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(\Doctrine\ORM\EntityManagerInterface::class);

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
