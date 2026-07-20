<?php

namespace App\Tests\Main\Service;

use Main\Service\ClaimantManager;
use Main\Service\MainManager;
use PHPUnit\Framework\TestCase;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ClaimantManagerExtraRolesTest extends TestCase
{
    public function testGetExtraRolesLoadsGlobalFile(): void
    {
        $manager = $this->createClaimantManager();

        self::assertContains('ROLE_ROOT', $manager->getExtraRoles());
        self::assertContains('ROLE_ADMIN', $manager->getExtraRoles());
        self::assertNotContains('ROLE_MAIN', $manager->getExtraRoles());
        self::assertNotContains('ROLE_MAIN_USER_ROOT', $manager->getExtraRoles());
    }

    private function createClaimantManager(): ClaimantManager
    {
        $validator = $this->createMock(ValidatorInterface::class);
        $mainManager = $this->createMock(MainManager::class);
        $manager = new ClaimantManager($validator, $mainManager);

        $container = $this->createMock(ContainerInterface::class);
        $container->method('getParameter')
            ->with('kernel.project_dir')
            ->willReturn(dirname(__DIR__, 3));
        $manager->setContainer($container);

        return $manager;
    }
}
