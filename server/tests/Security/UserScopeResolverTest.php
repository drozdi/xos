<?php

namespace App\Tests\Security;

use App\Security\UserScopeResolver;
use Doctrine\Common\Collections\ArrayCollection;
use Main\Entity\Claimant;
use Main\Entity\Group;
use Main\Entity\Group\Access as GroupAccess;
use Main\Entity\User;
use Main\Entity\User\Access as UserAccess;
use Main\Entity\User\Group as UserGroup;
use Main\Service\ClaimantManager;
use Main\Service\MainManager;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class UserScopeResolverTest extends TestCase
{
    private UserScopeResolver $resolver;
    private ClaimantManager $claimantManager;

    protected function setUp(): void
    {
        $validator = $this->createMock(ValidatorInterface::class);
        $mainManager = $this->createMock(MainManager::class);
        $logger = $this->createMock(LoggerInterface::class);
        $this->claimantManager = new ClaimantManager($validator, $mainManager, $logger);

        $container = $this->createMock(ContainerInterface::class);
        $container->method('getParameter')
            ->with('kernel.project_dir')
            ->willReturn(dirname(__DIR__, 2));
        $this->claimantManager->setContainer($container);

        $this->resolver = new UserScopeResolver($this->claimantManager);
    }

    public function testRoleRootHasFullAccessToMainScope(): void
    {
        $user = $this->userWithRoles(['ROLE_ROOT']);

        self::assertTrue($this->resolver->canAccessModule($user, 'main'));
        self::assertTrue($this->resolver->hasFullAppAccess($user, 'main'));
        self::assertTrue($this->resolver->checkHasScope($user, 'can_read.main.claimant'));
    }

    public function testRoleMainAllowsModuleButRequiresScope(): void
    {
        $user = $this->userWithRoles(['ROLE_MAIN', 'ROLE_USER']);

        self::assertTrue($this->resolver->canAccessModule($user, 'main'));
        self::assertFalse($this->resolver->hasFullAppAccess($user, 'main'));
        self::assertFalse($this->resolver->checkHasScope($user, 'can_read.main.claimant'));
    }

    public function testRoleMainRootBypassesScopeChecks(): void
    {
        $user = $this->userWithRoles(['ROLE_MAIN_ROOT', 'ROLE_USER']);

        self::assertTrue($this->resolver->canAccessModule($user, 'main'));
        self::assertTrue($this->resolver->hasFullAppAccess($user, 'main'));
        self::assertTrue($this->resolver->checkHasScope($user, 'can_delete.main.user'));
    }

    public function testPublicModuleAccessibleWithRoleUserOnly(): void
    {
        $user = $this->userWithRoles(['ROLE_USER']);

        self::assertTrue($this->resolver->canAccessModule($user, 'browser'));
        self::assertFalse($this->resolver->canAccessModule($user, 'main'));
        self::assertFalse($this->resolver->canAccessModule($user, 'inccom'));
    }

    public function testProtectedModuleRequiresModuleRole(): void
    {
        $user = $this->userWithRoles(['ROLE_USER']);

        self::assertFalse($this->resolver->canAccessModule($user, 'explorer'));
        self::assertFalse($this->resolver->canAccessModule($user, 'device'));
        self::assertFalse($this->resolver->canAccessModule($user, 'inccom'));
    }

	public function testScopeLevelUsesBitwiseSum(): void
	{
		$user = new User();
		$user->setRoles(['ROLE_MAIN', 'ROLE_USER']);

		$claimant = new Claimant();
		$claimant->setCode('main.claimant');
		$claimant->setName('Main: Правила');

		$access = new UserAccess();
		$access->setClaimant($claimant);
		$access->setLevel(2);
		$user->addAccess($access);

		self::assertTrue($this->resolver->checkHasScope($user, 'can_read.main.claimant'));
		self::assertFalse($this->resolver->checkHasScope($user, 'can_create.main.claimant'));
	}

	public function testGroupAccessUsedWhenUserHasNoDirectAccess(): void
	{
		$user = new User();
		$user->setRoles(['ROLE_MAIN', 'ROLE_USER']);

		$claimant = new Claimant();
		$claimant->setCode('main.group');
		$claimant->setName('Main: Группы');

		$group = new Group();
		$groupAccess = new GroupAccess();
		$groupAccess->setClaimant($claimant);
		$groupAccess->setLevel(2);
		$group->addAccess($groupAccess);

		$userGroup = new UserGroup();
		$userGroup->setGroup($group);
		$user->addGroup($userGroup);

		$scopes = $this->resolver->resolve($user);

		self::assertSame(2, $scopes['main.group']);
		self::assertTrue($this->resolver->checkHasScope($user, 'can_read.main.group'));
	}

	public function testUserDirectAccessOverridesGroupLevels(): void
	{
		$user = new User();
		$user->setRoles(['ROLE_MAIN', 'ROLE_USER']);

		$claimant = new Claimant();
		$claimant->setCode('main.user');
		$claimant->setName('Main: Пользователи');

		$userAccess = new UserAccess();
		$userAccess->setClaimant($claimant);
		$userAccess->setLevel(2);
		$user->addAccess($userAccess);

		$group = new Group();
		$groupAccess = new GroupAccess();
		$groupAccess->setClaimant($claimant);
		$groupAccess->setLevel(15);
		$group->addAccess($groupAccess);

		$userGroup = new UserGroup();
		$userGroup->setGroup($group);
		$user->addGroup($userGroup);

		$scopes = $this->resolver->resolve($user);

		self::assertSame(2, $scopes['main.user']);
		self::assertTrue($this->resolver->checkHasScope($user, 'can_read.main.user'));
		self::assertFalse($this->resolver->checkHasScope($user, 'can_create.main.user'));
	}

	public function testMultipleGroupsCombineWithBitwiseOr(): void
	{
		$user = new User();
		$user->setRoles(['ROLE_MAIN', 'ROLE_USER']);

		$claimant = new Claimant();
		$claimant->setCode('main.ou');
		$claimant->setName('Main: Подразделения');

		$groupA = new Group();
		$accessA = new GroupAccess();
		$accessA->setClaimant($claimant);
		$accessA->setLevel(1);
		$groupA->addAccess($accessA);

		$groupB = new Group();
		$accessB = new GroupAccess();
		$accessB->setClaimant($claimant);
		$accessB->setLevel(2);
		$groupB->addAccess($accessB);

		$userGroupA = new UserGroup();
		$userGroupA->setGroup($groupA);
		$user->addGroup($userGroupA);

		$userGroupB = new UserGroup();
		$userGroupB->setGroup($groupB);
		$user->addGroup($userGroupB);

		$scopes = $this->resolver->resolve($user);

		self::assertSame(3, $scopes['main.ou']);
		self::assertTrue($this->resolver->checkHasScope($user, 'can_read.main.ou'));
		self::assertTrue($this->resolver->checkHasScope($user, 'can_create.main.ou'));
	}

    /**
     * @param list<string> $roles
     */
    private function userWithRoles(array $roles): User
    {
        $user = $this->createMock(User::class);
        $user->method('getRoles')->willReturn($roles);
        $user->method('getAccesses')->willReturn(new ArrayCollection());
        $user->method('getGroups')->willReturn(new ArrayCollection());

        return $user;
    }
}
