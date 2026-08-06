<?php

namespace App\Tests\Main\Service;

use Doctrine\DBAL\Connection;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\Claimant;
use Main\Repository\ClaimantRepository;
use Main\Service\ClaimantManager;
use Main\Service\MainManager;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ClaimantManagerSyncTest extends TestCase
{
    /** @var list<Claimant> */
    private array $store = [];

    /** @var list<array{filter: mixed, payload: array}> */
    private array $claimantCalls = [];

    public function testSyncFromFixtureFillsAccessOptionsAndDefaultTitles(): void
    {
        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync'));

        $report = $manager->sync();

        self::assertFalse($report['aborted']);
        self::assertSame([], $report['errors']);
        self::assertContains('syncmain.user', $report['upserted']);
        self::assertContains('syncdevice', $report['upserted']);

        $byCode = $this->storeByCode();

        $user = $byCode['syncmain.user'];
        self::assertSame([
            'can_create' => ['bit' => 1, 'title' => 'Создание'],
            'can_read' => ['bit' => 2, 'title' => 'Чтение'],
            'can_update' => ['bit' => 4, 'title' => 'Изменение'],
            'can_delete' => ['bit' => 8, 'title' => 'Удаление'],
            'can_access' => [
                'bit' => 16,
                'title' => 'Права пользователя',
                'description' => 'Управление доступами',
            ],
        ], $user->getAccessOptions());

        $root = $byCode['syncdevice'];
        self::assertSame([
            'can_write_off' => ['bit' => 16, 'title' => 'Списание'],
        ], $root->getAccessOptions());
        self::assertSame('Sync Devices', $root->getName());
    }

    public function testNestedSoftwareTypeGetsOptionsFromNestedMapAccess(): void
    {
        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync'));

        $report = $manager->sync();

        self::assertFalse($report['aborted']);
        $type = $this->storeByCode()['syncdevice.software.type'];
        self::assertSame([
            'can_create' => ['bit' => 1, 'title' => 'Создание'],
            'can_read' => ['bit' => 2, 'title' => 'Чтение'],
            'can_update' => ['bit' => 4, 'title' => 'Изменение'],
            'can_delete' => ['bit' => 8, 'title' => 'Удаление'],
        ], $type->getAccessOptions());

        $mapAccess = $manager->getModuleConfig('syncdevice')['map-access'];
        $resolved = $manager->resolveClaimantAccessMap('syncdevice.software.type', $mapAccess);
        self::assertSame([
            'can_create' => 1,
            'can_read' => 2,
            'can_update' => 4,
            'can_delete' => 8,
        ], $resolved);
    }

    public function testIdempotentSyncDoesNotDuplicateCodesAndKeepsOptionsStable(): void
    {
        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync'));

        $first = $manager->sync();
        self::assertFalse($first['aborted']);
        $codesAfterFirst = array_keys($this->storeByCode());
        $optionsAfterFirst = array_map(
            static fn (Claimant $c) => $c->getAccessOptions(),
            $this->storeByCode()
        );
        $callsAfterFirst = count($this->claimantCalls);

        $second = $manager->sync();
        self::assertFalse($second['aborted']);
        self::assertSame($codesAfterFirst, array_keys($this->storeByCode()));
        self::assertSame($optionsAfterFirst, array_map(
            static fn (Claimant $c) => $c->getAccessOptions(),
            $this->storeByCode()
        ));
        self::assertCount(count($codesAfterFirst), array_unique($codesAfterFirst));
        self::assertGreaterThan($callsAfterFirst, count($this->claimantCalls));
    }

    public function testRejectNonIntBitAbortsWithoutWrites(): void
    {
        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync_invalid'));

        $report = $manager->sync();

        self::assertTrue($report['aborted']);
        self::assertSame([], $this->claimantCalls);
        self::assertSame([], $this->store);
        self::assertStringContainsString(
            'broken.item.can_read: invalid leaf',
            implode("\n", $report['errors'])
        );
    }

    public function testRejectNonPositiveBitAbortsWithoutWrites(): void
    {
        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync_invalid_zero'));

        $report = $manager->sync();

        self::assertTrue($report['aborted']);
        self::assertSame([], $this->claimantCalls);
        self::assertStringContainsString(
            'brokenzero.item.can_create: bit must be a positive integer, got 0',
            implode("\n", $report['errors'])
        );
    }

    public function testRejectBrokenObjectLeafAbortsWithoutWrites(): void
    {
        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync_invalid_leaf'));

        $report = $manager->sync();

        self::assertTrue($report['aborted']);
        self::assertSame([], $this->claimantCalls);
        self::assertStringContainsString(
            'brokenleaf.item.can_update: bit must be a positive integer',
            implode("\n", $report['errors'])
        );
    }

    public function testBitChangeWithoutForceAborts(): void
    {
        $existing = new Claimant();
        $existing->setCode('syncmain.user');
        $existing->setName('Sync Main: Users');
        $existing->setAccessOptions([
            'can_read' => ['bit' => 99, 'title' => 'Чтение'],
        ]);
        $this->store[] = $existing;

        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync'));
        $report = $manager->sync(false, false);

        self::assertTrue($report['aborted']);
        self::assertNotEmpty($report['bit_changes']);
        self::assertStringContainsString('bit changed', implode("\n", $report['errors']));
        self::assertSame([], $this->claimantCalls);
        self::assertSame(99, $existing->getAccessOptions()['can_read']['bit']);
    }

    public function testOrphanSoftClearsAccessOptionsWithoutDelete(): void
    {
        $orphan = new Claimant();
        $orphan->setCode('orphan.legacy');
        $orphan->setName('Orphan');
        $orphan->setAccessOptions([
            'can_read' => ['bit' => 2, 'title' => 'Чтение'],
        ]);
        $this->store[] = $orphan;

        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync'));
        $report = $manager->sync();

        self::assertFalse($report['aborted']);
        self::assertContains('orphan.legacy', $report['orphan']);
        self::assertArrayHasKey('orphan.legacy', $this->storeByCode());
        self::assertSame([], $this->storeByCode()['orphan.legacy']->getAccessOptions());
        self::assertSame('Orphan', $this->storeByCode()['orphan.legacy']->getName());
    }

    public function testRuntimeNormalizeCanBitReadsObjectAndIntLeaves(): void
    {
        $manager = $this->createSyncManager($this->fixtureDir('claimant_sync'));

        self::assertSame(16, $manager->normalizeCanBit([
            'bit' => 16,
            'title' => 'Права пользователя',
        ]));
        self::assertSame(2, $manager->normalizeCanBit(2));
        self::assertNull($manager->normalizeCanBit(['title' => 'no bit']));
        self::assertNull($manager->normalizeCanBit(0));

        // SyncMain fixture: user.can_access is object {bit:16}; can_read is int 2
        self::assertSame(16, $manager->getCanScopeValue('can_access.syncmain.user'));
        self::assertSame(2, $manager->getCanScopeValue('can_read.syncmain.user'));
        self::assertSame(1 | 2 | 4 | 8 | 16, $manager->getAccessesRoot('syncmain.user'));
    }

    private function fixtureDir(string $name): string
    {
        return dirname(__DIR__, 2).'/fixtures/'.$name;
    }

    /**
     * @return array<string, Claimant>
     */
    private function storeByCode(): array
    {
        $byCode = [];
        foreach ($this->store as $claimant) {
            $byCode[(string) $claimant->getCode()] = $claimant;
        }

        return $byCode;
    }

    private function createSyncManager(string $projectDir): ClaimantManager
    {
        $validator = $this->createMock(ValidatorInterface::class);
        /** @var MainManager&MockObject $mainManager */
        $mainManager = $this->createMock(MainManager::class);
        $mainManager->method('claimant')->willReturnCallback(
            function (mixed $filter, ?array $payload = null) {
                $this->claimantCalls[] = ['filter' => $filter, 'payload' => $payload ?? []];
                $code = is_array($filter) ? (string) ($filter['code'] ?? '') : '';
                if ('' === $code && isset($payload['code'])) {
                    $code = (string) $payload['code'];
                }

                $claimant = null;
                foreach ($this->store as $row) {
                    if ((string) $row->getCode() === $code) {
                        $claimant = $row;
                        break;
                    }
                }
                if (null === $claimant) {
                    $claimant = new Claimant();
                    $this->store[] = $claimant;
                }
                if (isset($payload['code'])) {
                    $claimant->setCode((string) $payload['code']);
                }
                if (isset($payload['name'])) {
                    $claimant->setName((string) $payload['name']);
                }
                if (array_key_exists('access_options', $payload ?? [])) {
                    $claimant->setAccessOptions((array) $payload['access_options']);
                }

                return $claimant;
            }
        );

        $logger = $this->createMock(LoggerInterface::class);
        $manager = new ClaimantManager($validator, $mainManager, $logger);

        $repo = $this->createMock(ClaimantRepository::class);
        $repo->method('findAll')->willReturnCallback(fn () => $this->store);

        $connection = $this->createMock(Connection::class);
        $connection->method('beginTransaction');
        $connection->method('commit');
        $connection->method('rollBack');
        $connection->method('isTransactionActive')->willReturn(false);

        $em = $this->createMock(EntityManagerInterface::class);
        $em->method('getRepository')->with(Claimant::class)->willReturn($repo);
        $em->method('getConnection')->willReturn($connection);

        $container = $this->createMock(ContainerInterface::class);
        $container->method('getParameter')
            ->with('kernel.project_dir')
            ->willReturn($projectDir);
        $container->method('get')
            ->with('doctrine.orm.default_entity_manager')
            ->willReturn($em);
        $manager->setContainer($container);

        return $manager;
    }
}
