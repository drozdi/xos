<?php

namespace App\Tests\Pkb;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Pkb\Entity\NoteIndex;
use Pkb\Entity\PkbLink;
use Pkb\Entity\Vault;
use Pkb\Service\GraphService;
use Pkb\Service\LinkIndexService;
use Pkb\Service\PkbManager;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class GraphServiceTest extends AuthWebTestCase
{
    public function testBuildGraphReturnsNodesAndEdges(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_graph_owner');
        $vault = $this->createVault($client, $owner);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);
        $linkIndexService->parseAndUpsert($vault, 'Notes/a.md', "# A\n\nLink [[B]]");
        $linkIndexService->parseAndUpsert($vault, 'Notes/b.md', "# B\n\nContent.");
        $linkIndexService->parseAndUpsert($vault, 'Notes/broken.md', 'See [[Missing Note]]');

        /** @var GraphService $graphService */
        $graphService = $client->getContainer()->get(GraphService::class);
        $graph = $graphService->buildGraph($vault);

        self::assertGreaterThanOrEqual(3, count($graph['nodes']));
        self::assertNotEmpty($graph['edges']);

        $nodeIds = array_column($graph['nodes'], 'id');
        self::assertContains('Notes/a.md', $nodeIds);
        self::assertContains('Notes/b.md', $nodeIds);

        $edge = $graph['edges'][0];
        self::assertArrayHasKey('source', $edge);
        self::assertArrayHasKey('target', $edge);
        self::assertArrayHasKey('type', $edge);
    }

    public function testBuildGraphWithTagFilter(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_graph_tag_owner');
        $vault = $this->createVault($client, $owner);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);
        $linkIndexService->parseAndUpsert($vault, 'Notes/tagged.md', "# Tagged\n\n#project");
        $linkIndexService->parseAndUpsert($vault, 'Notes/other.md', "# Other\n\nPlain note.");

        /** @var GraphService $graphService */
        $graphService = $client->getContainer()->get(GraphService::class);
        $graph = $graphService->buildGraph($vault, 'tag:project');

        self::assertCount(1, $graph['nodes']);
        self::assertSame('Notes/tagged.md', $graph['nodes'][0]['id']);
        self::assertContains('project', $graph['nodes'][0]['tags']);
    }

    public function testBuildGraphIncludesBrokenLinkPseudoNode(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_graph_broken_owner');
        $vault = $this->createVault($client, $owner);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);
        $linkIndexService->parseAndUpsert($vault, 'Notes/source.md', 'Link [[Ghost]]');

        /** @var GraphService $graphService */
        $graphService = $client->getContainer()->get(GraphService::class);
        $graph = $graphService->buildGraph($vault);

        $nodeIds = array_column($graph['nodes'], 'id');
        self::assertContains('__broken__:Ghost', $nodeIds);

        $brokenEdge = null;
        foreach ($graph['edges'] as $edge) {
            if ('__broken__:Ghost' === $edge['target']) {
                $brokenEdge = $edge;
                break;
            }
        }

        self::assertNotNull($brokenEdge);
        self::assertSame('Notes/source.md', $brokenEdge['source']);
    }

    public function testGraphApiEndpoint(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_graph_api_owner');

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'Graph API Vault']);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);
        $linkIndexService->parseAndUpsert($vault, 'Notes/x.md', "# X\n\n[[Y]]");
        $linkIndexService->parseAndUpsert($vault, 'Notes/y.md', "# Y");

        $login = $this->login($client, 'pkb_graph_api_owner', 'password');
        $headers = $this->jsonAuthHeaders($login['token']);

        $client->request('GET', '/api/pkb/vaults/'.$vault->getId().'/graph', [], [], $headers);
        self::assertResponseIsSuccessful();

        /** @var array{nodes: list<array{id: string}>, edges: list<array{source: string, target: string}>} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($payload['nodes']);
        self::assertNotEmpty($payload['edges']);
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

    private function createVault(KernelBrowser $client, User $owner): Vault
    {
        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);

        return $manager->createVault($owner, ['name' => 'Graph Test Vault']);
    }

    /** @return array<string, string> */
    protected function jsonAuthHeaders(string $token): array
    {
        return [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
