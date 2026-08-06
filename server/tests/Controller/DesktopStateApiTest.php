<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;

class DesktopStateApiTest extends AuthWebTestCase
{
    public function testGetRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/desktop-state');
        self::assertResponseStatusCodeSame(401);
    }

    public function testPutRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['settings' => [], 'explorerLastPath' => null], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(401);
    }

    public function testGetEmptySnapshot(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $client->request('GET', '/api/desktop-state', [], [], $this->authHeaders($loginPayload['token']));

        self::assertResponseIsSuccessful();
        self::assertSame(
            [
                'settings' => [],
                'explorerLastPath' => null,
            ],
            json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR)
        );
    }

    public function testGetFullSnapshot(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $headers,
            json_encode([
                'items' => [
                    ['category' => 'USER', 'key' => 'theme', 'value' => 'dark'],
                    ['category' => 'USER', 'key' => 'startMenu.pinnedApps', 'value' => ['explorer']],
                    ['category' => 'USER', 'key' => 'layout.view', 'value' => 'should-not-appear'],
                    ['category' => 'APP', 'key' => 'launchHistory', 'value' => [['appId' => 'explorer']]],
                    ['category' => 'APP', 'key' => 'otherAppPref', 'value' => true],
                    ['category' => 'WIN', 'key' => 'explorer/default', 'value' => ['state' => 'open']],
                    ['category' => 'HKEY_CONFIG', 'key' => 'foo', 'value' => 1],
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'explorer.last_path',
                'value' => ['path' => 'home://Docs'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'todo.ui.filters',
                'value' => ['status' => 'open'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/desktop-state', [], [], $headers);
        self::assertResponseIsSuccessful();

        /** @var array{settings: list<array{category: string, key: string, value: mixed}>, explorerLastPath: array{path: string, updatedAt: string}|null} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $keys = array_map(
            static fn (array $item): string => $item['category'].'/'.$item['key'],
            $payload['settings']
        );

        self::assertContains('USER/theme', $keys);
        self::assertContains('USER/startMenu.pinnedApps', $keys);
        self::assertContains('USER/layout.view', $keys);
        self::assertContains('APP/launchHistory', $keys);
        self::assertContains('APP/otherAppPref', $keys);
        self::assertContains('WIN/explorer/default', $keys);
        self::assertNotContains('HKEY_CONFIG/foo', $keys);

        self::assertNotNull($payload['explorerLastPath']);
        self::assertSame('home://Docs', $payload['explorerLastPath']['path']);
        self::assertArrayHasKey('updatedAt', $payload['explorerLastPath']);
    }

    public function testPutUpsertSnapshot(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [
                    ['category' => 'USER', 'key' => 'theme', 'value' => 'light'],
                    ['category' => 'USER', 'key' => 'startMenu.pinnedApps', 'value' => ['calendar']],
                    ['category' => 'APP', 'key' => 'launchHistory', 'value' => []],
                    [
                        'category' => 'WIN',
                        'key' => 'calculator/default',
                        'value' => ['position' => ['x' => 10]],
                    ],
                ],
                'explorerLastPath' => ['path' => 'home://Work'],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        /** @var array{settings: list<array{category: string, key: string, value: mixed}>, explorerLastPath: array{path: string}|null} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertCount(4, $payload['settings']);
        self::assertSame('home://Work', $payload['explorerLastPath']['path'] ?? null);

        $client->request('GET', '/api/desktop-state', [], [], $headers);
        self::assertResponseIsSuccessful();

        /** @var array{settings: list<array{category: string, key: string, value: mixed}>, explorerLastPath: array{path: string}|null} $reload */
        $reload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(4, $reload['settings']);
        self::assertSame('home://Work', $reload['explorerLastPath']['path'] ?? null);
    }

    public function testPutOrphanDeletesMissingWinKeys(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [
                    ['category' => 'WIN', 'key' => 'a', 'value' => ['n' => 1]],
                    ['category' => 'WIN', 'key' => 'b', 'value' => ['n' => 2]],
                ],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [
                    ['category' => 'WIN', 'key' => 'b', 'value' => ['n' => 22]],
                ],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        /** @var array{settings: list<array{category: string, key: string, value: mixed}>} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $payload['settings']);
        self::assertSame('b', $payload['settings'][0]['key']);
        self::assertSame(['n' => 22], $payload['settings'][0]['value']);

        $client->request('GET', '/api/settings/WIN/a', [], [], $headers);
        self::assertResponseStatusCodeSame(404);
    }

    public function testPutOrphanDeletesUserAndAppKeysNotInSnapshot(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [
                    ['category' => 'USER', 'key' => 'theme', 'value' => 'dark'],
                    ['category' => 'USER', 'key' => 'date.locale', 'value' => 'ru'],
                    ['category' => 'APP', 'key' => 'launchHistory', 'value' => [['appId' => 'x']]],
                ],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [
                    ['category' => 'USER', 'key' => 'theme', 'value' => 'light'],
                ],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        /** @var array{settings: list<array{category: string, key: string}>} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $payload['settings']);
        self::assertSame('theme', $payload['settings'][0]['key']);

        $client->request('GET', '/api/settings/USER/'.rawurlencode('date.locale'), [], [], $headers);
        self::assertResponseStatusCodeSame(404);

        $client->request('GET', '/api/settings/APP/launchHistory', [], [], $headers);
        self::assertResponseStatusCodeSame(404);
    }

    public function testPutDoesNotTouchHkeyAndForeignUserData(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/settings',
            [],
            [],
            $headers,
            json_encode([
                'items' => [
                    ['category' => 'HKEY_CONFIG', 'key' => 'foo', 'value' => 42],
                ],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'todo.ui.filters',
                'value' => ['status' => 'open'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [
                    ['category' => 'USER', 'key' => 'theme', 'value' => 'dark'],
                    ['category' => 'USER', 'key' => 'date.locale', 'value' => 'ru'],
                ],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/settings/HKEY_CONFIG/foo', [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var array{value: mixed} $hkey */
        $hkey = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(42, $hkey['value']);

        $client->request('GET', '/api/user-data/'.rawurlencode('todo.ui.filters'), [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var array{value: mixed} $todo */
        $todo = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['status' => 'open'], $todo['value']);
    }

    public function testPutNonManagedSettingReturns400(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'settings' => [
                    ['category' => 'HKEY_CONFIG', 'key' => 'foo', 'value' => 'nope'],
                ],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(400);
    }

    public function testPutNullExplorerDeletesKv(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [],
                'explorerLastPath' => ['path' => 'home://Docs'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/user-data/'.rawurlencode('explorer.last_path'), [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        /** @var array{explorerLastPath: mixed} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNull($payload['explorerLastPath']);

        $client->request('GET', '/api/user-data/'.rawurlencode('explorer.last_path'), [], [], $headers);
        self::assertResponseStatusCodeSame(404);
    }

    public function testPutInvalidBodyReturns400(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode(['settings' => []], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(400);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [['category' => 'WIN', 'key' => 'a']],
                'explorerLastPath' => null,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(400);

        $client->request(
            'PUT',
            '/api/desktop-state',
            [],
            [],
            $headers,
            json_encode([
                'settings' => [],
                'explorerLastPath' => ['path' => 123],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseStatusCodeSame(400);
    }
}
