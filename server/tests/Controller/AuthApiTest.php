<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Main\Entity\User;

class AuthApiTest extends AuthWebTestCase
{
    public function testLoginWithBadCredentialsReturns401(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $client->request(
            'POST',
            '/api/login',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'username' => self::TEST_LOGIN,
                'password' => 'wrong-password',
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(401);
    }

    public function testLoginWithValidCredentialsReturnsTokenAndUser(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $payload = $this->login($client);

        self::assertArrayHasKey('token', $payload);
        self::assertArrayHasKey('refresh_token', $payload);
        self::assertArrayHasKey('user', $payload);
        self::assertSame(self::TEST_LOGIN, $payload['user']['login']);
        self::assertSame(self::TEST_EMAIL, $payload['user']['email']);
        self::assertSame(self::TEST_ALIAS, $payload['user']['alias']);
        self::assertContains(User::ROLE_ADMIN, $payload['user']['roles']);
        self::assertIsArray($payload['user']['scopes']);
    }

    public function testTokenRefreshFlow(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'POST',
            '/api/token/refresh',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'refresh_token' => $loginPayload['refresh_token'],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        /** @var array{token: string, refresh_token: string} $refreshPayload */
        $refreshPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertArrayHasKey('token', $refreshPayload);
        self::assertArrayHasKey('refresh_token', $refreshPayload);
        self::assertNotSame($loginPayload['refresh_token'], $refreshPayload['refresh_token']);
    }

    public function testLoginCheckRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/login-check');
        self::assertResponseStatusCodeSame(401);
    }

    public function testLoginCheckWithValidToken(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request('GET', '/api/login-check', [], [], $this->authHeaders($loginPayload['token']));

        self::assertResponseIsSuccessful();
        self::assertSame(
            ['status' => 'authenticated'],
            json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function testLogoutInvalidatesSession(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'GET',
            '/api/logout',
            [],
            [],
            array_merge(
                $this->authHeaders($loginPayload['token']),
                ['CONTENT_TYPE' => 'application/json']
            ),
            json_encode([
                'refresh_token' => $loginPayload['refresh_token'],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();
        self::assertSame(
            ['status' => 'logged_out'],
            json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );

        $client->request(
            'POST',
            '/api/token/refresh',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode([
                'refresh_token' => $loginPayload['refresh_token'],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(401);
    }

    public function testUserEndpointReturnsProfileWithScopes(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request('GET', '/api/user', [], [], $this->authHeaders($loginPayload['token']));

        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $userPayload */
        $userPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame(self::TEST_LOGIN, $userPayload['login']);
        self::assertSame(self::TEST_EMAIL, $userPayload['email']);
        self::assertSame(self::TEST_ALIAS, $userPayload['alias']);
        self::assertArrayHasKey('scopes', $userPayload);
    }
}
