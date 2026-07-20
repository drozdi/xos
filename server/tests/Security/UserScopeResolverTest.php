<?php

namespace App\Tests\Security;

use App\Security\UserScopeResolver;
use Doctrine\Common\Collections\ArrayCollection;
use Main\Entity\Claimant;
use Main\Entity\User;
use Main\Entity\User\Access as UserAccess;
use Main\Service\ClaimantManager;
use Main\Service\MainManager;
use PHPUnit\Framework\TestCase;
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
        $this->claimantManager = new ClaimantManager($validator, $mainManager);

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

    /**
     * @param list<string> $roles
     */
    private function userWithRoles(array $roles): User
    {
        $user = $this->createMock(User::class);
        $user->method('getRoles')->willReturn($roles);
        $user->method('getAccesses')->willReturn(new ArrayCollection());

        return $user;
    }
}
