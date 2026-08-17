<?php

namespace App\Tests\Pkb;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Pkb\Entity\NoteIndex;
use Pkb\Entity\PkbLink;
use Pkb\Entity\Vault;
use Pkb\Entity\VaultMember;
use Pkb\Service\PkbManager;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class VaultMemberApiTest extends AuthWebTestCase
{
    public function testOwnerInvitesMemberByEmail(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_invite_owner');
        $reader = $this->createTestUser($client, 'pkb_reader', 'password', ['ROLE_USER']);
        $reader->setEmail('pkb_reader@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'Shared Vault']);
        $vaultId = $vault->getId();

        $ownerHeaders = $this->jsonAuthHeaders($this->login($client, 'pkb_invite_owner', 'password')['token']);

        $client->request(
            'POST',
            '/api/pkb/vaults/'.$vaultId.'/members',
            [],
            [],
            $ownerHeaders,
            json_encode(['email' => 'pkb_reader@example.com', 'role' => 'reader'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);

        /** @var list<array{user_id: int, role: string}> $members */
        $members = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(2, $members);
        self::assertSame('owner', $members[0]['role']);
        self::assertSame('reader', $members[1]['role']);
        self::assertSame($reader->getId(), $members[1]['user_id']);
    }

    public function testMemberSeesVaultInList(): void
    {
        $client = static::createClient();
        $owner = $this->prepareFixture($client, 'pkb_list_owner2');
        $editor = $this->createTestUser($client, 'pkb_editor', 'password', ['ROLE_USER']);
        $editor->setEmail('pkb_editor@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'Editor Vault']);
        $manager->inviteVaultMember($vault, $owner, (string) $editor->getId(), 'editor');

        $editorHeaders = $this->jsonAuthHeaders($this->login($client, 'pkb_editor', 'password')['token']);
        $client->request('GET', '/api/pkb/vaults', [], [], $editorHeaders);
        self::assertResponseIsSuccessful();

        /** @var list<array{id: int, role: string, is_owner: bool}> $list */
        $list = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertCount(1, $list);
        self::assertSame($vault->getId(), $list[0]['id']);
        self::assertSame('editor', $list[0]['role']);
        self::assertFalse($list[0]['is_owner']);
        self::assertTrue($list[0]['permissions']['can_write']);
    }

    public function testReaderCannotPutFileContent(): void
    {
        $client = static::createClient();
        [$vaultId, $readerHeaders] = $this->prepareSharedVaultWithRole($client, 'reader');

        $client->request(
            'PUT',
            '/api/pkb/vaults/'.$vaultId.'/files/content',
            [],
            [],
            $readerHeaders,
            json_encode(['path' => 'Notes/test.md', 'content' => '# Test'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(403);
    }

    public function testEditorCanPutFileContent(): void
    {
        $client = static::createClient();
        [$vaultId, $editorHeaders] = $this->prepareSharedVaultWithRole($client, 'editor');

        $client->request(
            'PUT',
            '/api/pkb/vaults/'.$vaultId.'/files/content',
            [],
            [],
            $editorHeaders,
            json_encode(['path' => 'Notes/editor-note.md', 'content' => '# Editor Note'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
    }

    /** @return array{0: int, 1: array<string, string>} */
    private function prepareSharedVaultWithRole(KernelBrowser $client, string $role): array
    {
        $owner = $this->prepareFixture($client, 'pkb_share_owner_'.$role);
        $member = $this->createTestUser($client, 'pkb_share_'.$role, 'password', ['ROLE_USER']);
        $member->setEmail('pkb_share_'.$role.'@example.com');
        /** @var EntityManagerInterface $em */
        $em = $client->getContainer()->get(EntityManagerInterface::class);
        $em->flush();

        /** @var PkbManager $manager */
        $manager = $client->getContainer()->get(PkbManager::class);
        $vault = $manager->createVault($owner, ['name' => 'ACL Vault']);
        $manager->inviteVaultMember($vault, $owner, (string) $member->getId(), $role);

        $memberHeaders = $this->jsonAuthHeaders($this->login($client, 'pkb_share_'.$role, 'password')['token']);

        return [$vault->getId(), $memberHeaders];
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
            $em->getClassMetadata(VaultMember::class),
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

    /** @return array<string, string> */
    protected function jsonAuthHeaders(string $token): array
    {
        return [
            'HTTP_AUTHORIZATION' => 'Bearer '.$token,
            'CONTENT_TYPE' => 'application/json',
        ];
    }
}
