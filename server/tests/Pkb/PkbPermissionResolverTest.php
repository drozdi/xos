<?php

namespace App\Tests\Pkb;

use Main\Entity\User;
use Pkb\Entity\Vault;
use Pkb\Entity\VaultMember;
use Pkb\Enum\VaultMemberRole;
use Pkb\Service\PkbPermissionResolver;
use PHPUnit\Framework\TestCase;

class PkbPermissionResolverTest extends TestCase
{
    private PkbPermissionResolver $resolver;

    protected function setUp(): void
    {
        $memberRepo = $this->createMock(\Pkb\Repository\VaultMemberRepository::class);
        $memberRepo->method('findOneByVaultAndUser')->willReturnCallback(
            function (Vault $vault, User $user): ?VaultMember {
                foreach ($vault->getMembers() as $member) {
                    if ($member->getUser()?->getId() === $user->getId()) {
                        return $member;
                    }
                }

                return null;
            },
        );

        $this->resolver = new PkbPermissionResolver($memberRepo);
    }

    public function testOwnerHasAllPermissions(): void
    {
        [$vault, $owner] = $this->createVaultWithOwner();

        self::assertTrue($this->resolver->isOwner($vault, $owner));
        self::assertNull($this->resolver->resolveRole($vault, $owner));
        self::assertTrue($this->resolver->canViewVault($vault, $owner));
        self::assertTrue($this->resolver->canReadFiles($vault, $owner));
        self::assertTrue($this->resolver->canWriteFiles($vault, $owner));
        self::assertTrue($this->resolver->canManageMembers($vault, $owner));
        self::assertTrue($this->resolver->canUpdateVault($vault, $owner));
        self::assertTrue($this->resolver->canDeleteVault($vault, $owner));
        self::assertTrue($this->resolver->canRebuildIndex($vault, $owner));
    }

    public function testReaderPermissions(): void
    {
        [$vault, $owner, $reader] = $this->createVaultWithMember(VaultMemberRole::Reader);

        self::assertTrue($this->resolver->canViewVault($vault, $reader));
        self::assertTrue($this->resolver->canReadFiles($vault, $reader));
        self::assertFalse($this->resolver->canWriteFiles($vault, $reader));
        self::assertFalse($this->resolver->canManageMembers($vault, $reader));
        self::assertFalse($this->resolver->canDeleteVault($vault, $reader));
        self::assertFalse($this->resolver->canRebuildIndex($vault, $reader));
        self::assertSame(VaultMemberRole::Reader, $this->resolver->resolveRole($vault, $reader));
        self::assertFalse($this->resolver->isOwner($vault, $reader));
        unset($owner);
    }

    public function testEditorPermissions(): void
    {
        [$vault, , $editor] = $this->createVaultWithMember(VaultMemberRole::Editor);

        self::assertTrue($this->resolver->canViewVault($vault, $editor));
        self::assertTrue($this->resolver->canReadFiles($vault, $editor));
        self::assertTrue($this->resolver->canWriteFiles($vault, $editor));
        self::assertFalse($this->resolver->canManageMembers($vault, $editor));
        self::assertFalse($this->resolver->canDeleteVault($vault, $editor));
        self::assertSame(VaultMemberRole::Editor, $this->resolver->resolveRole($vault, $editor));
    }

    public function testNonMemberHasNoPermissions(): void
    {
        [$vault] = $this->createVaultWithOwner();
        $stranger = $this->createUser(99, 'stranger@example.com');

        self::assertFalse($this->resolver->canViewVault($vault, $stranger));
        self::assertFalse($this->resolver->canReadFiles($vault, $stranger));
        self::assertFalse($this->resolver->canWriteFiles($vault, $stranger));
        self::assertFalse($this->resolver->canManageMembers($vault, $stranger));
        self::assertFalse($this->resolver->canDeleteVault($vault, $stranger));
        self::assertNull($this->resolver->resolveRole($vault, $stranger));
    }

    /** @return array{0: Vault, 1: User} */
    private function createVaultWithOwner(): array
    {
        $owner = $this->createUser(1, 'owner@example.com');
        $vault = new Vault();
        $vault->setOwner($owner);

        return [$vault, $owner];
    }

    /** @return array{0: Vault, 1: User, 2: User} */
    private function createVaultWithMember(VaultMemberRole $role): array
    {
        [$vault, $owner] = $this->createVaultWithOwner();
        $memberUser = $this->createUser(2, 'member@example.com');

        $member = new VaultMember();
        $member->setUser($memberUser);
        $member->setRole($role);
        $vault->addMember($member);

        return [$vault, $owner, $memberUser];
    }

    private function createUser(int $id, string $email): User
    {
        $user = new User();
        $user->setEmail($email);
        $user->setLogin('user'.$id);

        $reflection = new \ReflectionClass($user);
        $property = $reflection->getProperty('id');
        $property->setAccessible(true);
        $property->setValue($user, $id);

        return $user;
    }
}
