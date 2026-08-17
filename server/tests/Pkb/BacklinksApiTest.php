<?php

namespace App\Tests\Pkb;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Pkb\Entity\NoteIndex;
use Pkb\Entity\PkbLink;
use Pkb\Entity\Vault;
use Pkb\Service\LinkIndexService;
use Pkb\Service\PkbManager;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class BacklinksApiTest extends AuthWebTestCase
{
    public function testBacklinksAndByTitleEndpoints(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_api_owner');

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'API Vault']);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);
        $linkIndexService->parseAndUpsert($vault, 'Notes/source.md', 'Link [[Target Note]]');
        $linkIndexService->parseAndUpsert($vault, 'Notes/Target Note.md', "# Target Note\n\nContent.");

        $login = $this->login($client, 'pkb_api_owner', 'password');
        $headers = $this->jsonAuthHeaders($login['token']);
        $vaultId = $vault->getId();

        $client->request(
            'GET',
            '/api/pkb/vaults/'.$vaultId.'/backlinks?path='.rawurlencode('Notes/Target Note.md'),
            [],
            [],
            $headers,
        );
        self::assertResponseIsSuccessful();
        /** @var array{backlinks: list<array{sourcePath: string, sourceTitle: string, linkType: string}>} $backlinksPayload */
        $backlinksPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $backlinksPayload['backlinks']);
        self::assertSame('Notes/source.md', $backlinksPayload['backlinks'][0]['sourcePath']);
        self::assertSame('wikilink', $backlinksPayload['backlinks'][0]['linkType']);

        $client->request(
            'GET',
            '/api/pkb/vaults/'.$vaultId.'/notes/by-title?title='.rawurlencode('Target Note'),
            [],
            [],
            $headers,
        );
        self::assertResponseIsSuccessful();
        /** @var array{path: string, title: string, ambiguous: bool} $byTitlePayload */
        $byTitlePayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Notes/Target Note.md', $byTitlePayload['path']);
        self::assertSame('Target Note', $byTitlePayload['title']);
        self::assertFalse($byTitlePayload['ambiguous']);

        $client->request('GET', '/api/pkb/vaults/'.$vaultId.'/notes', [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var array{notes: list<array{path: string, title: string, inbound_count: int}>} $notesPayload */
        $notesPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertGreaterThanOrEqual(2, count($notesPayload['notes']));
    }

    public function testPutContentTriggersIndexing(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_put_owner');

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'Put Vault']);
        $vaultId = $vault->getId();

        $login = $this->login($client, 'pkb_put_owner', 'password');
        $headers = $this->jsonAuthHeaders($login['token']);

        $client->request(
            'PUT',
            '/api/pkb/vaults/'.$vaultId.'/files/content',
            [],
            [],
            $headers,
            json_encode([
                'path' => 'Notes/new-note.md',
                'content' => "# New Note\n\nSee [[Other]] and #tag",
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        /** @var array{index?: array{path: string, title: string, tags: list<string>}} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertArrayHasKey('index', $payload);
        self::assertSame('Notes/new-note.md', $payload['index']['path'] ?? null);
        self::assertSame('New Note', $payload['index']['title'] ?? null);
        self::assertContains('tag', $payload['index']['tags'] ?? []);
    }

    private function prepareFixture(KernelBrowser $client, string $login): User
    {
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $em->getClassMetadata(User::class),
            $em->getClassMetadata(\App\Entity\RefreshToken::class),
            $em->getClassMetadata(\Main\Entity\User\Access::class),
            $em->getClassMetadata(\Main\Entity\Claimant::class),
            $em->getClassMetadata(\App\Entity\UserSetting::class),
            $em->getClassMetadata(Vault::class),
            $em->getClassMetadata(NoteIndex::class),
            $em->getClassMetadata(PkbLink::class),
        ];
        $schemaTool = new SchemaTool($em);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        $user = $this->createTestUser($client, $login, 'password', ['ROLE_USER']);
        $dir = dirname(__DIR__, 2).'/var/explorer/home/'.$user->getId();
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        return $user;
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
