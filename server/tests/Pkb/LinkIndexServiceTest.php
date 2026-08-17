<?php

namespace App\Tests\Pkb;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Pkb\Entity\NoteIndex;
use Pkb\Entity\PkbLink;
use Pkb\Entity\Vault;
use Pkb\Repository\NoteIndexRepository;
use Pkb\Repository\PkbLinkRepository;
use Pkb\Service\LinkIndexService;
use Pkb\Service\PkbManager;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class LinkIndexServiceTest extends AuthWebTestCase
{
    public function testSaveNoteWithWikilinkCreatesLinkRow(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_link_owner');
        $vault = $this->createVault($client, $owner);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);

        $linkIndexService->parseAndUpsert($vault, 'Notes/source.md', "# Source\n\nLink to [[Other Note]]");

        /** @var PkbLinkRepository $linkRepo */
        $linkRepo = $client->getContainer()->get(PkbLinkRepository::class);
        $links = $linkRepo->findBy(['vault' => $vault, 'sourcePath' => 'Notes/source.md']);

        self::assertCount(1, $links);
        self::assertSame('wikilink', $links[0]->getLinkType());
        self::assertSame('Other Note', $links[0]->getTargetKey());
        self::assertNull($links[0]->getTargetPath());
    }

    public function testSaveTargetNoteUpdatesInboundCountOnSourceTargets(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_inbound_owner');
        $vault = $this->createVault($client, $owner);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);

        $linkIndexService->parseAndUpsert($vault, 'Notes/source.md', 'See [[Other Note]]');
        $linkIndexService->parseAndUpsert($vault, 'Notes/Other Note.md', "# Other Note\n\nTarget content.");

        /** @var NoteIndexRepository $noteRepo */
        $noteRepo = $client->getContainer()->get(NoteIndexRepository::class);
        $target = $noteRepo->findOneByVaultAndPath($vault, 'Notes/Other Note.md');
        self::assertInstanceOf(NoteIndex::class, $target);
        self::assertSame(1, $target->getInboundCount());

        /** @var PkbLinkRepository $linkRepo */
        $linkRepo = $client->getContainer()->get(PkbLinkRepository::class);
        $sourceLinks = $linkRepo->findBy(['vault' => $vault, 'sourcePath' => 'Notes/source.md']);
        self::assertSame('Notes/Other Note.md', $sourceLinks[0]->getTargetPath());
    }

    public function testTagsIndexed(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_tags_owner');
        $vault = $this->createVault($client, $owner);

        /** @var LinkIndexService $linkIndexService */
        $linkIndexService = $client->getContainer()->get(LinkIndexService::class);

        $summary = $linkIndexService->parseAndUpsert(
            $vault,
            'Notes/tagged.md',
            "# Tagged\n\n#project #area/work",
        );

        self::assertSame(['project', 'area/work'], $summary['tags']);

        /** @var NoteIndexRepository $noteRepo */
        $noteRepo = $client->getContainer()->get(NoteIndexRepository::class);
        $note = $noteRepo->findOneByVaultAndPath($vault, 'Notes/tagged.md');
        self::assertInstanceOf(NoteIndex::class, $note);
        self::assertSame(['project', 'area/work'], $note->getTags());

        /** @var PkbLinkRepository $linkRepo */
        $linkRepo = $client->getContainer()->get(PkbLinkRepository::class);
        $tagLinks = $linkRepo->findBy(['vault' => $vault, 'linkType' => PkbLink::TYPE_TAG]);
        self::assertCount(2, $tagLinks);
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
        $this->ensureHomeDir($user);

        return $user;
    }

    private function createVault(KernelBrowser $client, User $owner): Vault
    {
        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);

        return $manager->createVault($owner, ['name' => 'Test Vault']);
    }

    private function ensureHomeDir(User $user): void
    {
        $dir = $this->homeDir($user);
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }
    }

    private function homeDir(User $user): string
    {
        return dirname(__DIR__, 2).'/var/explorer/home/'.$user->getId();
    }
}
