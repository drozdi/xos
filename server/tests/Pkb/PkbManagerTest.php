<?php

namespace App\Tests\Pkb;

use App\Tests\AuthWebTestCase;
use Main\Entity\User;
use Pkb\Entity\Vault;
use Pkb\Service\PkbManager;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class PkbManagerTest extends AuthWebTestCase
{
    public function testCreateVaultGeneratesSlugAndDbRecord(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_owner');
        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);

        $vault = $manager->createVault($owner, ['name' => 'My Knowledge Base']);

        self::assertInstanceOf(Vault::class, $vault);
        self::assertNotNull($vault->getId());
        self::assertSame('my-knowledge-base', $vault->getSlug());
        self::assertSame('home://Vaults/my-knowledge-base/', $vault->getRootPath());
        self::assertTrue($vault->isPersonal());
        self::assertSame($owner->getId(), $vault->getOwner()?->getId());

        $homeDir = $this->homeDir($owner);
        self::assertDirectoryExists($homeDir.'/Vaults/my-knowledge-base/Notes');
        self::assertDirectoryExists($homeDir.'/Vaults/my-knowledge-base/.xos-vault');
        self::assertFileExists($homeDir.'/Vaults/my-knowledge-base/.xos-vault/config.json');
    }

    public function testListReturnsOwnedVaults(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_list_owner');
        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);

        $manager->createVault($owner, ['name' => 'Vault A']);
        $manager->createVault($owner, ['name' => 'Vault B']);

        $list = $manager->listVaultsForUser($owner);
        self::assertCount(2, $list);
        self::assertSame('Vault B', $list[0]['name']);
        self::assertSame('Vault A', $list[1]['name']);
    }

    public function testNonOwnerCannotAccessVault(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_owner_access');
        $other = $this->createTestUser($client, 'pkb_other', 'password', ['ROLE_USER']);
        $this->ensureHomeDir($other);

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'Private']);

        $this->expectException(AccessDeniedHttpException::class);
        $manager->getVault($vault->getId(), $other);
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
        ];
        $schemaTool = new SchemaTool($em);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        $user = $this->createTestUser($client, $login, 'password', ['ROLE_USER']);
        $this->ensureHomeDir($user);

        return $user;
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
