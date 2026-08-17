<?php

namespace App\Tests\Pkb;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Pkb\Entity\NoteIndex;
use Pkb\Entity\PkbLink;
use Pkb\Entity\Vault;
use Pkb\Service\PkbManager;
use Pkb\Service\SearchReplaceService;
use Pkb\Service\VaultFileService;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class SearchReplaceServiceTest extends AuthWebTestCase
{
    public function testSearchReplaceDryRunAndExecute(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_replace_owner');
        $vault = $this->createVault($client, $owner);

        /** @var VaultFileService $vaultFileService */
        $vaultFileService = $client->getContainer()->get(VaultFileService::class);
        $vaultFileService->putContent($vault, $owner, 'Notes/a.md', "# A\n\nfoo bar foo");
        $vaultFileService->putContent($vault, $owner, 'Notes/b.md', "# B\n\nno match");

        /** @var SearchReplaceService $searchReplaceService */
        $searchReplaceService = $client->getContainer()->get(SearchReplaceService::class);

        $dryRun = $searchReplaceService->searchReplace($vault, $owner, 'foo', 'baz', true);
        self::assertSame(1, $dryRun['matchedFiles']);
        self::assertSame(0, $dryRun['replacedFiles']);
        self::assertSame(['Notes/a.md'], $dryRun['paths']);

        $contentBefore = $vaultFileService->getContent($vault, $owner, 'Notes/a.md');
        self::assertStringContainsString('foo', $contentBefore);

        $executed = $searchReplaceService->searchReplace($vault, $owner, 'foo', 'baz', false);
        self::assertSame(1, $executed['matchedFiles']);
        self::assertSame(1, $executed['replacedFiles']);

        $contentAfter = $vaultFileService->getContent($vault, $owner, 'Notes/a.md');
        self::assertStringContainsString('baz bar baz', $contentAfter);
        self::assertStringNotContainsString('foo', $contentAfter);
    }

    public function testSearchReplaceRejectsEmptyFind(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_replace_empty_owner');
        $vault = $this->createVault($client, $owner);

        /** @var SearchReplaceService $searchReplaceService */
        $searchReplaceService = $client->getContainer()->get(SearchReplaceService::class);

        $this->expectException(\Symfony\Component\HttpKernel\Exception\BadRequestHttpException::class);
        $searchReplaceService->searchReplace($vault, $owner, '', 'x', false);
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

        return $manager->createVault($owner, ['name' => 'Replace Test Vault']);
    }
}
