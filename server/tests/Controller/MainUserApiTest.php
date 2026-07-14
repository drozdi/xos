<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;

class MainUserApiTest extends AuthWebTestCase
{
    public function testUserListRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/main/user/list',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['t' => 'list', 'limit' => 20, 'offset' => 1], JSON_THROW_ON_ERROR)
        );

        self::assertResponseStatusCodeSame(401);
    }

    public function testUserListReturnsItemsAndContentRange(): void
    {
        $client = static::createClient();
        $this->prepareAuthDatabase($client);

        $loginPayload = $this->login($client);

        $client->request(
            'POST',
            '/api/main/user/list',
            [],
            [],
            array_merge($this->authHeaders($loginPayload['token']), [
                'CONTENT_TYPE' => 'application/json',
            ]),
            json_encode([
                't' => 'list',
                'limit' => 20,
                'offset' => 1,
                'sortBy' => [['key' => 'login', 'order' => 'ASC']],
                'filters' => ['ou' => -1, 'group' => -1],
            ], JSON_THROW_ON_ERROR)
        );

        self::assertResponseIsSuccessful();

        $contentRange = $client->getResponse()->headers->get('Content-Range');
        self::assertNotNull($contentRange);
        self::assertStringContainsString('items', $contentRange);

        /** @var list<array{id: int, login: string, alias: string}> $items */
        $items = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        self::assertIsArray($items);
        self::assertGreaterThanOrEqual(1, count($items));
        self::assertArrayHasKey('id', $items[0]);
        self::assertArrayHasKey('login', $items[0]);
        self::assertArrayHasKey('alias', $items[0]);
        self::assertSame(self::TEST_LOGIN, $items[0]['login']);
    }
}
