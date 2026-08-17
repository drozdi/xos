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
use Board\Enum\MemberRole;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class BoardApiTest extends AuthWebTestCase
{
    public function testWorkspacesRequireAuth(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/board/workspaces');
        self::assertResponseStatusCodeSame(401);
    }

    public function testWorkspaceCrudInviteAndPermissions(): void
    {
        $client = static::createClient();
        $this->prepareBoardDatabase($client);

        $owner = $this->createTestUser($client, 'board_owner', 'password', ['ROLE_USER']);
        $owner->setEmail('board_owner@example.com');
        $admin = $this->createTestUser($client, 'board_admin', 'password', ['ROLE_USER']);
        $admin->setEmail('board_admin@example.com');
        $editor = $this->createTestUser($client, 'board_editor', 'password', ['ROLE_USER']);
        $editor->setEmail('board_editor@example.com');
        $observer = $this->createTestUser($client, 'board_observer', 'password', ['ROLE_USER']);
        $observer->setEmail('board_observer@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        $ownerHeaders = $this->jsonAuthHeaders($this->login($client, 'board_owner', 'password')['token']);

        $client->request(
            'POST',
            '/api/board/workspaces',
            [],
            [],
            $ownerHeaders,
            json_encode(['name' => 'Team Alpha', 'description' => 'Main workspace'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int, name: string} $workspace */
        $workspace = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Team Alpha', $workspace['name']);
        $workspaceId = $workspace['id'];

        $client->request(
            'POST',
            '/api/board/workspaces/'.$workspaceId.'/members',
            [],
            [],
            $ownerHeaders,
            json_encode(['email' => 'board_admin@example.com', 'role' => 'admin'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);

        $client->request(
            'POST',
            '/api/board/workspaces/'.$workspaceId.'/members',
            [],
            [],
            $ownerHeaders,
            json_encode(['email' => 'board_editor@example.com', 'role' => 'editor'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/board/workspaces/'.$workspaceId.'/members',
            [],
            [],
            $ownerHeaders,
            json_encode(['email' => 'board_observer@example.com', 'role' => 'observer'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/board/workspaces', [], [], $ownerHeaders);
        self::assertResponseIsSuccessful();
        /** @var list<array{id: int}> $list */
        $list = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame($workspaceId, $list[0]['id']);

        $client->request(
            'POST',
            '/api/board/workspaces/'.$workspaceId.'/boards',
            [],
            [],
            $ownerHeaders,
            json_encode(['title' => 'Sprint 1', 'visibility' => 'workspace'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int, lists: array, labels: array, permissions: array{can_edit: bool}} $board */
        $board = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Sprint 1', $board['title'] ?? null);
        self::assertSame([], $board['lists']);
        self::assertSame([], $board['labels']);
        self::assertTrue($board['permissions']['can_edit']);
        $boardId = $board['id'];

        $editorHeaders = $this->jsonAuthHeaders($this->login($client, 'board_editor', 'password')['token']);
        $client->request('GET', '/api/board/boards/'.$boardId, [], [], $editorHeaders);
        self::assertResponseIsSuccessful();

        $observerHeaders = $this->jsonAuthHeaders($this->login($client, 'board_observer', 'password')['token']);
        $client->request('GET', '/api/board/boards/'.$boardId, [], [], $observerHeaders);
        self::assertResponseStatusCodeSame(403);

        $client->request(
            'PUT',
            '/api/board/workspaces/'.$workspaceId,
            [],
            [],
            $editorHeaders,
            json_encode(['name' => 'Hacked'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(403);

        $adminHeaders = $this->jsonAuthHeaders($this->login($client, 'board_admin', 'password')['token']);
        $client->request(
            'PUT',
            '/api/board/workspaces/'.$workspaceId,
            [],
            [],
            $adminHeaders,
            json_encode(['name' => 'Team Alpha Updated'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/board/boards/'.$boardId,
            [],
            [],
            $adminHeaders,
            json_encode(['title' => 'Sprint 1 Updated'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request('DELETE', '/api/board/workspaces/'.$workspaceId, [], [], $adminHeaders);
        self::assertResponseStatusCodeSame(403);

        $client->request('DELETE', '/api/board/workspaces/'.$workspaceId, [], [], $ownerHeaders);
        self::assertResponseIsSuccessful();
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
