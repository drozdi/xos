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

class BoardFilterApiTest extends AuthWebTestCase
{
    public function testFilterCardsByAssigneeLabelDueAndSearch(): void
    {
        $client = static::createClient();
        $this->prepareBoardDatabase($client);

        $owner = $this->createTestUser($client, 'filter_owner', 'password', ['ROLE_USER']);
        $owner->setEmail('filter_owner@example.com');
        $assignee = $this->createTestUser($client, 'filter_assignee', 'password', ['ROLE_USER']);
        $assignee->setEmail('filter_assignee@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $headers = $this->jsonAuthHeaders($this->login($client, 'filter_owner', 'password')['token']);

        $client->request(
            'POST',
            '/api/board/workspaces',
            [],
            [],
            $headers,
            json_encode(['name' => 'Filter WS'], JSON_THROW_ON_ERROR),
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
            json_encode(['title' => 'Filter Board'], JSON_THROW_ON_ERROR),
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
            json_encode(['title' => 'List'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $list */
        $list = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/board/boards/'.$board['id'].'/labels',
            [],
            [],
            $headers,
            json_encode(['name' => 'Bug', 'color' => '#eb5a46'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $label */
        $label = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'POST',
            '/api/board/lists/'.$list['id'].'/cards',
            [],
            [],
            $headers,
            json_encode(['title' => 'Alpha task'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $cardMatch */
        $cardMatch = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request(
            'PUT',
            '/api/board/cards/'.$cardMatch['id'],
            [],
            [],
            $headers,
            json_encode(['description_md' => 'Fix login bug', 'due_date' => '2026-08-25T00:00:00'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/board/cards/'.$cardMatch['id'].'/assignees',
            [],
            [],
            $headers,
            json_encode(['user_ids' => [$assignee->getId()]], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/board/cards/'.$cardMatch['id'].'/labels',
            [],
            [],
            $headers,
            json_encode(['label_ids' => [$label['id']]], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/board/lists/'.$list['id'].'/cards',
            [],
            [],
            $headers,
            json_encode(['title' => 'Other card'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $cardOther */
        $cardOther = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/board/boards/'.$board['id'].'/cards', [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var array{card_ids: list<int>, filtered: bool} $all */
        $all = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertFalse($all['filtered']);
        self::assertCount(2, $all['card_ids']);

        $client->request(
            'GET',
            '/api/board/boards/'.$board['id'].'/cards?assignee='.$assignee->getId(),
            [],
            [],
            $headers,
        );
        self::assertResponseIsSuccessful();
        /** @var array{card_ids: list<int>, filtered: bool} $byAssignee */
        $byAssignee = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertTrue($byAssignee['filtered']);
        self::assertSame([$cardMatch['id']], $byAssignee['card_ids']);

        $client->request(
            'GET',
            '/api/board/boards/'.$board['id'].'/cards?label='.$label['id'],
            [],
            [],
            $headers,
        );
        self::assertResponseIsSuccessful();
        /** @var array{card_ids: list<int>} $byLabel */
        $byLabel = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([$cardMatch['id']], $byLabel['card_ids']);

        $client->request(
            'GET',
            '/api/board/boards/'.$board['id'].'/cards?due_after=2026-08-20&due_before=2026-08-30',
            [],
            [],
            $headers,
        );
        self::assertResponseIsSuccessful();
        /** @var array{card_ids: list<int>} $byDue */
        $byDue = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([$cardMatch['id']], $byDue['card_ids']);

        $client->request(
            'GET',
            '/api/board/boards/'.$board['id'].'/cards?q=login',
            [],
            [],
            $headers,
        );
        self::assertResponseIsSuccessful();
        /** @var array{card_ids: list<int>} $bySearch */
        $bySearch = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame([$cardMatch['id']], $bySearch['card_ids']);
        self::assertNotContains($cardOther['id'], $bySearch['card_ids']);
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
