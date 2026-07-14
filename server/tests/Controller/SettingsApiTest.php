<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;

class SettingsApiTest extends AuthWebTestCase
{
    public function testGetSettingsEmpty(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request('GET', '/api/settings', [], [], $this->authHeaders($loginPayload['token']));

        self::assertResponseIsSuccessful();
        self::assertSame(
            ['items' => []],
            json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function testPostSingleSetting(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'category' => 'WIN',
                'key' => 'users',
                'value' => [
                    'position' => ['x' => 100, 'y' => 50, 'width' => 800, 'height' => 600],
                ],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('WIN', $payload['category']);
        self::assertSame('users', $payload['key']);
        self::assertIsArray($payload['value']);
        self::assertArrayHasKey('updatedAt', $payload);
    }

    public function testPostBatchSettings(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'items' => [
                    [
                        'category' => 'WIN',
                        'key' => 'calculator',
                        'value' => ['state' => 'open'],
                    ],
                    [
                        'category' => 'USER',
                        'key' => 'layout.view',
                        'value' => 'hhh lmr ffr',
                    ],
                ],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        /** @var array{items: array<int, array<string, mixed>>} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertCount(2, $payload['items']);
        self::assertSame('WIN', $payload['items'][0]['category']);
        self::assertSame('USER', $payload['items'][1]['category']);
    }

    public function testGetOneSetting(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'category' => 'USER',
                'key' => 'layout.panels.left.width',
                'value' => 280,
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        $encodedKey = rawurlencode('layout.panels.left.width');
        $client->request(
            'GET',
            '/api/settings/USER/'.$encodedKey,
            [],
            [],
            $this->authHeaders($loginPayload['token'])
        );

        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('USER', $payload['category']);
        self::assertSame('layout.panels.left.width', $payload['key']);
        self::assertSame(280, $payload['value']);
    }

    public function testDeleteSetting(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'category' => 'APP',
                'key' => 'launchHistory',
                'value' => ['users'],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        $encodedKey = rawurlencode('launchHistory');
        $client->request(
            'DELETE',
            '/api/settings/APP/'.$encodedKey,
            [],
            [],
            $this->authHeaders($loginPayload['token'])
        );

        self::assertResponseStatusCodeSame(204);

        $client->request(
            'GET',
            '/api/settings/APP/'.$encodedKey,
            [],
            [],
            $this->authHeaders($loginPayload['token'])
        );

        self::assertResponseStatusCodeSame(404);
    }

    public function testSettingsIsolationBetweenUsers(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);
        $this->createTestUser($client, 'other_user', 'other_password');

        $userAPayload = $this->login($client);
        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $this->authHeaders($userAPayload['token']),
            json_encode([
                'category' => 'USER',
                'key' => 'layout.view',
                'value' => 'private-layout',
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $userBPayload = $this->login($client, 'other_user', 'other_password');
        $encodedKey = rawurlencode('layout.view');
        $client->request(
            'GET',
            '/api/settings/USER/'.$encodedKey,
            [],
            [],
            $this->authHeaders($userBPayload['token'])
        );

        self::assertResponseStatusCodeSame(404);
    }

    public function testInvalidCategoryReturns400(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'category' => 'INVALID',
                'key' => 'test',
                'value' => true,
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(400);
    }

    public function testDeviceLegacyRedirect(): void
    {
        $client = static::createClient();
        $client->followRedirects(false);

        $client->request('GET', '/device/types/list');

        self::assertResponseStatusCodeSame(308);
        self::assertSame('/api/device/types/list', $client->getResponse()->headers->get('Location'));
        self::assertSame('true', $client->getResponse()->headers->get('Deprecation'));
    }
}
