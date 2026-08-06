<?php

namespace App\Tests\Repository;

use App\Entity\UserAppData;
use App\Repository\UserAppDataRepository;
use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class UserAppDataRepositoryTest extends AuthWebTestCase
{
    public function testUpsertInsertsThenUpdatesWithoutDuplicate(): void
    {
        $client = static::createClient();
        $em = $this->prepareUserAppDataSchema($client);
        $user = $this->createTestUser($client);

        /** @var UserAppDataRepository $repo */
        $repo = $em->getRepository(UserAppData::class);

        $first = $repo->upsert($user, 'todo.ui.filters', ['status' => 'open']);
        $em->flush();
        $em->clear();

        $user = $em->find(User::class, $user->getId());
        self::assertNotNull($user);

        $createdAt = $repo->findOneByUserCode($user, 'todo.ui.filters')?->getCreatedAt();
        self::assertNotNull($createdAt);
        $firstUpdatedAt = $repo->findOneByUserCode($user, 'todo.ui.filters')?->getUpdatedAt();
        self::assertNotNull($firstUpdatedAt);

        // Ensure updated_at can differ on second upsert.
        sleep(1);

        $second = $repo->upsert($user, 'todo.ui.filters', ['status' => 'done']);
        $em->flush();
        $em->clear();

        $user = $em->find(User::class, $user->getId());
        self::assertNotNull($user);

        $all = $repo->findByUser($user);
        self::assertCount(1, $all);
        self::assertSame(1, $repo->countByUser($user));

        $row = $repo->findOneByUserCode($user, 'todo.ui.filters');
        self::assertNotNull($row);
        self::assertSame(['status' => 'done'], $row->getValue());
        self::assertEquals($createdAt, $row->getCreatedAt());
        self::assertGreaterThan($firstUpdatedAt->getTimestamp(), $row->getUpdatedAt()->getTimestamp());
        self::assertSame($first->getId(), $second->getId());
    }

    public function testFindByUserPrefixAndDelete(): void
    {
        $client = static::createClient();
        $em = $this->prepareUserAppDataSchema($client);
        $user = $this->createTestUser($client);

        /** @var UserAppDataRepository $repo */
        $repo = $em->getRepository(UserAppData::class);

        $repo->upsert($user, 'todo.ui.filters', ['a' => 1]);
        $repo->upsert($user, 'todo.draft.compose', ['b' => 2]);
        $repo->upsert($user, 'inccom.ui.panel', ['c' => 3]);
        $em->flush();

        $todo = $repo->findByUser($user, 'todo.');
        self::assertCount(2, $todo);
        self::assertSame(['todo.draft.compose', 'todo.ui.filters'], array_map(
            static fn (UserAppData $row): string => $row->getCode(),
            $todo
        ));

        self::assertTrue($repo->deleteByUserCode($user, 'todo.ui.filters'));
        $em->flush();

        self::assertFalse($repo->deleteByUserCode($user, 'todo.ui.filters'));
        self::assertNull($repo->findOneByUserCode($user, 'todo.ui.filters'));
        self::assertSame(2, $repo->countByUser($user));
    }

    public function testUniqueConstraintOnUserAndCode(): void
    {
        $client = static::createClient();
        $em = $this->prepareUserAppDataSchema($client);
        $user = $this->createTestUser($client);

        $now = new \DateTimeImmutable();
        $a = (new UserAppData())
            ->setUser($user)
            ->setCode('todo.dup')
            ->setValue(['n' => 1])
            ->setCreatedAt($now)
            ->setUpdatedAt($now);
        $b = (new UserAppData())
            ->setUser($user)
            ->setCode('todo.dup')
            ->setValue(['n' => 2])
            ->setCreatedAt($now)
            ->setUpdatedAt($now);

        $em->persist($a);
        $em->persist($b);

        $this->expectException(\Doctrine\DBAL\Exception\UniqueConstraintViolationException::class);
        $em->flush();
    }

    private function prepareUserAppDataSchema(KernelBrowser $client): EntityManagerInterface
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(User::class),
            $entityManager->getClassMetadata(UserAppData::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        return $entityManager;
    }
}
