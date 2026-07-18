<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Explorer\Entity\UserDisk;
use Main\Entity\Claimant;
use Main\Entity\User;
use Main\Entity\User\Access as UserAccess;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class ExplorerApiTest extends AuthWebTestCase
{
    private const SCOPE_READ = 1;
    private const SCOPE_WRITE = 2;
    private const SCOPE_DELETE = 4;
    private const SCOPE_ALL = 7;

    public function testConfigRequiresAuthentication(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/explorer/config');
        self::assertResponseStatusCodeSame(403);
    }

    public function testConfigForbiddenWithoutScope(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $this->createTestUser($client, 'no_explorer', 'password', ['ROLE_USER']);
        $loginPayload = $this->login($client, 'no_explorer', 'password');

        $client->request('GET', '/api/explorer/config', [], [], $this->jsonAuthHeaders($loginPayload['token']));
        self::assertResponseStatusCodeSame(403);
    }

    public function testConfigAllowedWithReadScope(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_reader', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_READ);
        $loginPayload = $this->login($client, 'explorer_reader', 'password');

        $client->request('GET', '/api/explorer/config', [], [], $this->jsonAuthHeaders($loginPayload['token']));
        self::assertResponseIsSuccessful();

        /** @var array{disks: list<array{code: string}>} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($payload['disks']);
    }

    public function testListAndMkdirFlow(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_writer', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_writer', 'password')['token']);

        $client->request('GET', '/api/explorer/list?path=home://', [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/explorer/folder',
            [],
            [],
            $headers,
            json_encode(['path' => 'home://docs'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);

        $client->request('GET', '/api/explorer/list?path=home://', [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var array{items: list<array{name: string}>} $list */
        $list = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('docs', $list['items'][0]['name'] ?? null);
    }

    public function testRenameCopyMove(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_ops', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_ops', 'password')['token']);
        $homeDir = $this->homeDir($user);

        mkdir($homeDir.'/src', 0775, true);
        file_put_contents($homeDir.'/src/note.txt', 'hello');

        $client->request(
            'PATCH',
            '/api/explorer/rename',
            [],
            [],
            $headers,
            json_encode(['path' => 'home://src/note.txt', 'newName' => 'readme.txt'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/explorer/copy',
            [],
            [],
            $headers,
            json_encode(['from' => 'home://src/readme.txt', 'to' => 'home://src/copy.txt'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        $client->request(
            'POST',
            '/api/explorer/move',
            [],
            [],
            $headers,
            json_encode(['from' => 'home://src/copy.txt', 'to' => 'home://moved.txt'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        self::assertFileExists($homeDir.'/moved.txt');
    }

    public function testTrashRestoreAndEmpty(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_trash', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_trash', 'password')['token']);
        $homeDir = $this->homeDir($user);

        file_put_contents($homeDir.'/temp.txt', 'temp');

        $client->request('DELETE', '/api/explorer/item?path=home://temp.txt', [], [], $headers);
        self::assertResponseStatusCodeSame(204);
        self::assertFileDoesNotExist($homeDir.'/temp.txt');

        $client->request('GET', '/api/explorer/trash?disk=home://', [], [], $headers);
        self::assertResponseIsSuccessful();
        /** @var array{items: list<array{path: string}>} $trash */
        $trash = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($trash['items']);
        $trashPath = $trash['items'][0]['path'];

        $client->request(
            'POST',
            '/api/explorer/trash/restore',
            [],
            [],
            $headers,
            json_encode(['path' => $trashPath], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        self::assertFileExists($homeDir.'/temp.txt');

        $client->request('DELETE', '/api/explorer/item?path=home://temp.txt', [], [], $headers);
        self::assertResponseStatusCodeSame(204);

        $client->request('DELETE', '/api/explorer/trash?disk=home://', [], [], $headers);
        self::assertResponseStatusCodeSame(204);
    }

    public function testPathTraversalIsRejected(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_secure', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_secure', 'password')['token']);

        $client->request('GET', '/api/explorer/list?path=home://../secret', [], [], $headers);
        self::assertResponseStatusCodeSame(400);
    }

    public function testTreeAndInfo(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_tree', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_READ);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_tree', 'password')['token']);
        $homeDir = $this->homeDir($user);
        mkdir($homeDir.'/tree', 0775, true);

        $client->request('GET', '/api/explorer/tree?path=home://&depth=2', [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/explorer/info?path=home://tree', [], [], $headers);
        self::assertResponseIsSuccessful();
    }

    public function testWriteForbiddenWithoutWriteScope(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_readonly', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_READ);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_readonly', 'password')['token']);

        $client->request(
            'POST',
            '/api/explorer/folder',
            [],
            [],
            $headers,
            json_encode(['path' => 'home://denied'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(403);
    }

    public function testArchivePackAndUnpack(): void
    {
        if (!class_exists(\ZipArchive::class)) {
            self::markTestSkipped('Zip extension is not available');
        }

        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_zip', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_zip', 'password')['token']);
        $homeDir = $this->homeDir($user);
        file_put_contents($homeDir.'/one.txt', '1');
        file_put_contents($homeDir.'/two.txt', '2');

        $client->request(
            'POST',
            '/api/explorer/archive/pack',
            [],
            [],
            $headers,
            json_encode([
                'sources' => ['home://one.txt', 'home://two.txt'],
                'destination' => 'home://packed.zip',
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        self::assertFileExists($homeDir.'/packed.zip');

        $client->request(
            'POST',
            '/api/explorer/archive/unpack',
            [],
            [],
            $headers,
            json_encode([
                'archive' => 'home://packed.zip',
                'destination' => 'home://unpacked/',
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        self::assertFileExists($homeDir.'/unpacked/one.txt');
    }

    public function testUserDiskCrud(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_disk', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_disk', 'password')['token']);
        $customRoot = sys_get_temp_dir().'/explorer_disk_'.uniqid();
        mkdir($customRoot, 0775, true);

        $client->request(
            'POST',
            '/api/explorer/disks',
            [],
            [],
            $headers,
            json_encode([
                'code' => 'custom',
                'label' => 'Custom',
                'adapter' => 'local',
                'root' => $customRoot,
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(201);
        /** @var array{id: int} $created */
        $created = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);

        $client->request('GET', '/api/explorer/disks', [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request('DELETE', '/api/explorer/disks/'.$created['id'], [], [], $headers);
        self::assertResponseStatusCodeSame(204);
    }

    public function testUploadsDiskIsReadOnly(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_uploads', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_uploads', 'password')['token']);

        $client->request(
            'POST',
            '/api/explorer/folder',
            [],
            [],
            $headers,
            json_encode(['path' => 'uploads://hack'], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(400);
    }

    public function testCrossDiskCopy(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_cross', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_cross', 'password')['token']);
        $homeDir = $this->homeDir($user);
        $imgDir = dirname(__DIR__, 2).'/../img';
        if (!is_dir($imgDir)) {
            mkdir($imgDir, 0775, true);
        }

        file_put_contents($imgDir.'/cross-source.txt', 'cross');

        $client->request(
            'POST',
            '/api/explorer/copy',
            [],
            [],
            $headers,
            json_encode([
                'from' => 'img://cross-source.txt',
                'to' => 'home://cross-source.txt',
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();
        self::assertFileExists($homeDir.'/cross-source.txt');
        self::assertSame('cross', file_get_contents($homeDir.'/cross-source.txt'));
    }

    public function testCopyConflictWithoutOverwrite(): void
    {
        $client = static::createClient();
        $this->prepareExplorerDatabase($client);
        $user = $this->createTestUser($client, 'explorer_conflict', 'password', ['ROLE_USER']);
        $this->grantExplorerScope($client, $user, self::SCOPE_ALL);
        $headers = $this->jsonAuthHeaders($this->login($client, 'explorer_conflict', 'password')['token']);
        $homeDir = $this->homeDir($user);
        file_put_contents($homeDir.'/a.txt', 'a');
        file_put_contents($homeDir.'/b.txt', 'b');

        $client->request(
            'POST',
            '/api/explorer/copy',
            [],
            [],
            $headers,
            json_encode(['from' => 'home://a.txt', 'to' => 'home://b.txt', 'overwrite' => false], JSON_THROW_ON_ERROR),
        );
        self::assertResponseStatusCodeSame(400);
    }

    protected function prepareExplorerDatabase(KernelBrowser $client): void
    {
        $this->prepareAuthDatabase($client);

        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(UserDisk::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->createSchema($metadata);
    }

    protected function grantExplorerScope(KernelBrowser $client, User $user, int $level): void
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);

        $claimant = new Claimant();
        $claimant->setCode('explorer');
        $claimant->setName('Explorer');

        $access = new UserAccess();
        $access->setUser($user);
        $access->setClaimant($claimant);
        $access->setLevel($level);

        $entityManager->persist($claimant);
        $entityManager->persist($access);
        $entityManager->flush();
    }

    /**
     * @return array<string, string>
     */
    protected function jsonAuthHeaders(string $token): array
    {
        return array_merge($this->authHeaders($token), [
            'CONTENT_TYPE' => 'application/json',
        ]);
    }

    private function homeDir(User $user): string
    {
        $dir = dirname(__DIR__, 2).'/var/explorer/home/'.$user->getId();
        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        return $dir;
    }
}
