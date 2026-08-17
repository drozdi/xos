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
use Pkb\Service\SearchService;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class SearchServiceTest extends AuthWebTestCase
{
    public function testSearchByTitleAndExcerpt(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_search_owner');
        $vault = $this->createVault($client, $owner);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);
        $linkIndexService->parseAndUpsert(
            $vault,
            'Notes/findme.md',
            "# Find Me\n\nUnique keyword alpha in body.",
        );
        $linkIndexService->parseAndUpsert(
            $vault,
            'Notes/other.md',
            "# Other\n\nNothing relevant here.",
        );

        /** @var SearchService $searchService */
        $searchService = $client->getContainer()->get(SearchService::class);

        $byTitle = $searchService->search($vault, 'Find Me');
        self::assertCount(1, $byTitle['results']);
        self::assertSame('Notes/findme.md', $byTitle['results'][0]['path']);
        self::assertGreaterThan(0, $byTitle['results'][0]['score']);

        $byExcerpt = $searchService->search($vault, 'alpha');
        self::assertCount(1, $byExcerpt['results']);
        self::assertSame('Notes/findme.md', $byExcerpt['results'][0]['path']);
    }

    public function testSearchReturnsEmptyForBlankQuery(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_search_blank_owner');
        $vault = $this->createVault($client, $owner);

        /** @var SearchService $searchService */
        $searchService = $client->getContainer()->get(SearchService::class);
        $result = $searchService->search($vault, '   ');

        self::assertSame([], $result['results']);
    }

    public function testSearchApiEndpoint(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_search_api_owner');

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'Search Vault']);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);
        $linkIndexService->parseAndUpsert($vault, 'Notes/query.md', "# Query Note\n\nsearchable text");

        $login = $this->login($client, 'pkb_search_api_owner', 'password');
        $headers = $this->jsonAuthHeaders($login['token']);

        $client->request(
            'GET',
            '/api/pkb/vaults/'.$vault->getId().'/search?q='.rawurlencode('Query'),
            [],
            [],
            $headers,
        );
        self::assertResponseIsSuccessful();

        /** @var array{results: list<array{path: string, title: string}>} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($payload['results']);
        self::assertSame('Notes/query.md', $payload['results'][0]['path']);
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

        return $manager->createVault($owner, ['name' => 'Search Test Vault']);
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
