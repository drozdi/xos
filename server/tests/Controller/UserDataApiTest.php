<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;

class UserDataApiTest extends AuthWebTestCase
{
    public function testListRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/user-data');
        self::assertResponseStatusCodeSame(401);
    }

    public function testCrudHappyPath(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);
        $headers = $this->authHeaders($loginPayload['token']);

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

        /** @var array<string, mixed> $created */
        $created = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertSame('todo.ui.filters', $created['code']);
        self::assertSame(['status' => 'open'], $created['value']);
        self::assertArrayHasKey('createdAt', $created);
        self::assertArrayHasKey('updatedAt', $created);

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'todo.draft.compose',
                'value' => ['text' => 'hello'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/user-data', [], [], $headers);
        self::assertResponseIsSuccessful();

        /** @var array{items: array<int, array<string, mixed>>} $list */
        $list = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(2, $list['items']);

        $client->request('GET', '/api/user-data?prefix=todo.ui.', [], [], $headers);
        self::assertResponseIsSuccessful();

        /** @var array{items: array<int, array<string, mixed>>} $filtered */
        $filtered = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $filtered['items']);
        self::assertSame('todo.ui.filters', $filtered['items'][0]['code']);

        $encodedCode = rawurlencode('todo.ui.filters');
        $client->request('GET', '/api/user-data/'.$encodedCode, [], [], $headers);
        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $one */
        $one = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('todo.ui.filters', $one['code']);
        self::assertSame(['status' => 'open'], $one['value']);

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'todo.ui.filters',
                'value' => ['status' => 'done'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $updated */
        $updated = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['status' => 'done'], $updated['value']);
        self::assertSame($created['createdAt'], $updated['createdAt']);

        $client->request('DELETE', '/api/user-data/'.$encodedCode, [], [], $headers);
        self::assertResponseStatusCodeSame(204);

        $client->request('GET', '/api/user-data/'.$encodedCode, [], [], $headers);
        self::assertResponseStatusCodeSame(404);

        $client->request('DELETE', '/api/user-data/'.$encodedCode, [], [], $headers);
        self::assertResponseStatusCodeSame(404);
    }

    public function testIsolationBetweenUsers(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);
        $this->createTestUser($client, 'other_user', 'other_password');

        $userAPayload = $this->login($client);
        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $this->authHeaders($userAPayload['token']),
            json_encode([
                'code' => 'todo.ui.filters',
                'value' => ['owner' => 'A'],
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        $userBPayload = $this->login($client, 'other_user', 'other_password');
        $encodedCode = rawurlencode('todo.ui.filters');

        $client->request(
            'GET',
            '/api/user-data/'.$encodedCode,
            [],
            [],
            $this->authHeaders($userBPayload['token'])
        );
        self::assertResponseStatusCodeSame(404);

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $this->authHeaders($userBPayload['token']),
            json_encode([
                'code' => 'todo.ui.filters',
                'value' => ['owner' => 'B'],
                'userId' => $userAPayload['user']['id'] ?? 1,
            ], JSON_THROW_ON_ERROR)
        );
        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $bOwn */
        $bOwn = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['owner' => 'B'], $bOwn['value']);

        $client->request(
            'DELETE',
            '/api/user-data/'.$encodedCode,
            [],
            [],
            $this->authHeaders($userBPayload['token'])
        );
        self::assertResponseStatusCodeSame(204);

        $client->request(
            'GET',
            '/api/user-data/'.$encodedCode,
            [],
            [],
            $this->authHeaders($userAPayload['token'])
        );
        self::assertResponseIsSuccessful();

        /** @var array<string, mixed> $aStill */
        $aStill = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(['owner' => 'A'], $aStill['value']);
    }

    public function testInvalidCodeReturns400(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'code' => 'Bad Code!',
                'value' => true,
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(400);
    }

    public function testCodeTooLongReturns400(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'code' => str_repeat('a', 192),
                'value' => true,
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(400);
    }

    public function testOversizedValueReturns400(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'PUT',
            '/api/user-data',
            [],
            [],
            $this->authHeaders($loginPayload['token']),
            json_encode([
                'code' => 'todo.big.payload',
                'value' => str_repeat('x', 70000),
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(400);
    }
}
