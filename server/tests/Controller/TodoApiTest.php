<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Todo\Entity\TodoItem;
use Todo\Entity\TodoList;
use Todo\Entity\TodoListShare;

class TodoApiTest extends AuthWebTestCase
{
    public function testListRequiresAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/todo/lists');
        self::assertResponseStatusCodeSame(401);
    }

    public function testCrudShareAndMarkdown(): void
    {
        $client = static::createClient();
        $this->prepareTodoDatabase($client);

        $owner = $this->createTestUser($client, 'todo_owner', 'password', ['ROLE_USER']);
        $owner->setEmail('owner@example.com');
        $guest = $this->createTestUser($client, 'todo_guest', 'password', ['ROLE_USER']);
        $guest->setEmail('guest@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $login = $this->login($client, 'todo_owner', 'password');
        $headers = $this->jsonAuthHeaders($login['token']);

        $client->request(
            'POST',
            '/api/todo/lists',
            [],
            [],
            $headers,
            json_encode([
                'title' => 'Покупки',
                'color' => '#90caf9',
                'markdown' => "- [ ] Молоко | due:2026-07-25 18:00\n- [x] Хлеб\n\n---\n\nНе забыть скидку",
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int, markdown: string, items: list<array{text: string, done: bool, due_at: ?string}>} $created */
        $created = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Покупки', $created['title'] ?? null);
        self::assertCount(2, $created['items']);
        self::assertFalse($created['items'][0]['done']);
        self::assertTrue($created['items'][1]['done']);
        self::assertNotEmpty($created['items'][0]['due_at']);
        self::assertStringContainsString('Не забыть скидку', $created['markdown']);

        $listId = $created['id'];

        $client->request(
            'POST',
            '/api/todo/lists/'.$listId.'/share',
            [],
            [],
            $headers,
            json_encode(['email' => 'guest@example.com', 'permission' => 'write'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $guestLogin = $this->login($client, 'todo_guest', 'password');
        $guestHeaders = $this->jsonAuthHeaders($guestLogin['token']);

        $client->request('GET', '/api/todo/lists', [], [], $guestHeaders);
        self::assertResponseIsSuccessful();
        /** @var list<array{id: int}> $lists */
        $lists = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($listId, $lists[0]['id']);

        $client->request(
            'PUT',
            '/api/todo/lists/'.$listId,
            [],
            [],
            $guestHeaders,
            json_encode([
                'markdown' => "- [x] Молоко | due:2026-07-25 18:00\n- [x] Хлеб",
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        /** @var array{items: list<array{done: bool}>} $updated */
        $updated = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertTrue($updated['items'][0]['done']);

        $client->request('GET', '/api/todo/users/by-email?email=owner@example.com', [], [], $guestHeaders);
        self::assertResponseIsSuccessful();
    }

    private function prepareTodoDatabase(KernelBrowser $client): void
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(User::class),
            $entityManager->getClassMetadata(\App\Entity\RefreshToken::class),
            $entityManager->getClassMetadata(\Main\Entity\User\Access::class),
            $entityManager->getClassMetadata(\Main\Entity\Claimant::class),
            $entityManager->getClassMetadata(\App\Entity\UserSetting::class),
            $entityManager->getClassMetadata(TodoList::class),
            $entityManager->getClassMetadata(TodoItem::class),
            $entityManager->getClassMetadata(TodoListShare::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    /**
     * @return array<string, string>
     */
    protected function jsonAuthHeaders(string $token): array
    {
        return [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
