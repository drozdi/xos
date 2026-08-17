<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\BoardMember;
use Board\Entity\Card;
use Board\Entity\Label;
use Board\Entity\Workspace;
use Board\Entity\WorkspaceMember;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class BoardListCardApiTest extends AuthWebTestCase
{
    public function testListCardLabelAndMoveApi(): void
    {
        $client = static::createClient();
        $this->prepareBoardDatabase($client);

        $owner = $this->createTestUser($client, 'lc_owner', 'password', ['ROLE_USER']);
        $owner->setEmail('lc_owner@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $headers = $this->jsonAuthHeaders($this->login($client, 'lc_owner', 'password')['token']);

        $client->request(
            'POST',
            '/api/board/workspaces',
            [],
            [],
            $headers,
            json_encode(['name' => 'WS'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $workspace */
        $workspace = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/board/workspaces/'.$workspace['id'].'/boards',
            [],
            [],
            $headers,
            json_encode(['title' => 'Kanban', 'visibility' => 'private'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $board */
        $board = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/board/boards/'.$board['id'].'/lists',
            [],
            [],
            $headers,
            json_encode(['title' => 'To Do'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int, order_index: int} $listA */
        $listA = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(1024, $listA['order_index']);

        $client->request(
            'POST',
            '/api/board/boards/'.$board['id'].'/lists',
            [],
            [],
            $headers,
            json_encode(['title' => 'Done'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $listB */
        $listB = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/board/lists/'.$listA['id'].'/cards',
            [],
            [],
            $headers,
            json_encode(['title' => 'Card 1'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int, position: int} $card */
        $card = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(1024, $card['position']);

        $client->request(
            'PUT',
            '/api/board/cards/'.$card['id'].'/move',
            [],
            [],
            $headers,
            json_encode(['list_id' => $listB['id'], 'position' => 1024], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        /** @var array{list_id: int} $moved */
        $moved = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($listB['id'], $moved['list_id']);

        $client->request(
            'POST',
            '/api/board/boards/'.$board['id'].'/labels',
            [],
            [],
            $headers,
            json_encode(['name' => 'Bug', 'color' => '#eb5a46'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);

        $client->request('GET', '/api/board/boards/'.$board['id'], [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var array{lists: list<array{cards: list<array{id: int}>}>, labels: list<array{name: string}>} $detail */
        $detail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(2, $detail['lists']);
        self::assertCount(1, $detail['labels']);
        self::assertSame($card['id'], $detail['lists'][1]['cards'][0]['id']);
    }

    private function prepareBoardDatabase(KernelBrowser $client): void
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(User::class),
            $entityManager->getClassMetadata(\App\Entity\RefreshToken::class),
            $entityManager->getClassMetadata(\Main\Entity\User\Access::class),
            $entityManager->getClassMetadata(\Main\Entity\Claimant::class),
            $entityManager->getClassMetadata(\App\Entity\UserSetting::class),
            $entityManager->getClassMetadata(Workspace::class),
            $entityManager->getClassMetadata(WorkspaceMember::class),
            $entityManager->getClassMetadata(Board::class),
            $entityManager->getClassMetadata(BoardMember::class),
            $entityManager->getClassMetadata(BoardList::class),
            $entityManager->getClassMetadata(Card::class),
            $entityManager->getClassMetadata(Label::class),
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
