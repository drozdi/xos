<?php

namespace App\Tests\Controller;

use App\Tests\AuthWebTestCase;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Main\Entity\Claimant;
use Main\Entity\User;
use Main\Entity\User\Access as UserAccess;
use SchoolTask\Entity\EpEvent;
use SchoolTask\Entity\EpSubject;
use SchoolTask\Entity\StGroup;
use SchoolTask\Security\SchoolTaskAccessMessages;
use Symfony\Bundle\FrameworkBundle\KernelBrowser;

class SchoolTaskApiTest extends AuthWebTestCase
{
    private const SCOPE_READ = 2;
    private const SCOPE_CREATE = 1;
    private const SCOPE_UPDATE = 4;
    private const SCOPE_DELETE = 8;
    private const SCOPE_ALL = 15;

    public function testSubjectListRequiresAuthentication(): void
    {
        $client = static::createClient();

        $client->request(
            'POST',
            '/api/schooltask/subjects/list',
            [],
            [],
            ['CONTENT_TYPE' => 'application/json'],
            json_encode(['limit' => -1, 'offset' => 1], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(403);
    }

    public function testSubjectListForbiddenWithoutPermission(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);
        $this->createTestUser($client, 'plain_user', 'plain_password', ['ROLE_USER']);
        $loginPayload = $this->login($client, 'plain_user', 'plain_password');

        $client->request(
            'POST',
            '/api/schooltask/subjects/list',
            [],
            [],
            $this->jsonAuthHeaders($loginPayload['token']),
            json_encode(['limit' => -1, 'offset' => 1], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(403);

        /** @var array{message: string} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Недостаточно прав', $payload['message']);
    }

    public function testSubjectListAllowedWithCanReadScope(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);
        $user = $this->createTestUser($client, 'subject_reader', 'read_password', ['ROLE_USER']);
        $this->grantSchooltaskScope($client, $user, 'schooltask.subject', self::SCOPE_READ);
        $loginPayload = $this->login($client, 'subject_reader', 'read_password');

        $client->request(
            'POST',
            '/api/schooltask/subjects/list',
            [],
            [],
            $this->jsonAuthHeaders($loginPayload['token']),
            json_encode(['limit' => -1, 'offset' => 1], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();
    }

    public function testSubjectCrudFlow(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);
        $teacher = $this->createTestUser($client, 'math_teacher', 'teacher_password', ['ROLE_USER']);
        $admin = $this->createTestUser($client, 'subject_admin', 'admin_password', ['ROLE_SCHOOLTASK_SUBJECT_ROOT']);
        $this->grantSchooltaskScope($client, $admin, 'schooltask.subject', self::SCOPE_ALL);
        $loginPayload = $this->login($client, 'subject_admin', 'admin_password');
        $headers = $this->jsonAuthHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/schooltask/subjects',
            [],
            [],
            $headers,
            json_encode([
                'name' => 'Математика',
                'sort' => 10,
                'user_ids' => [$teacher->getId()],
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(201);

        /** @var array{id: int, name: string, sort: int, users: array<int, array{user_id: int}>} $created */
        $created = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Математика', $created['name']);
        self::assertSame(10, $created['sort']);
        self::assertArrayHasKey($teacher->getId(), $created['users']);

        $subjectId = $created['id'];

        $client->request('GET', '/api/schooltask/subjects/'.$subjectId, [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/schooltask/subjects/'.$subjectId,
            [],
            [],
            $headers,
            json_encode([
                'name' => 'Алгебра',
                'sort' => 20,
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        /** @var array{name: string, sort: int} $updated */
        $updated = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Алгебра', $updated['name']);
        self::assertSame(20, $updated['sort']);

        $client->request('DELETE', '/api/schooltask/subjects/'.$subjectId, [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/schooltask/subjects/'.$subjectId, [], [], $headers);
        self::assertResponseStatusCodeSame(404);
    }

    public function testSubjectCreateForbiddenWithoutPermission(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);
        $user = $this->createTestUser($client, 'subject_reader_only', 'read_password', ['ROLE_USER']);
        $this->grantSchooltaskScope($client, $user, 'schooltask.subject', self::SCOPE_READ);
        $loginPayload = $this->login($client, 'subject_reader_only', 'read_password');

        $client->request(
            'POST',
            '/api/schooltask/subjects',
            [],
            [],
            $this->jsonAuthHeaders($loginPayload['token']),
            json_encode(['name' => 'Физика', 'sort' => 100], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(403);

        /** @var array{message: string} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(SchoolTaskAccessMessages::CREATE_SUBJECT, $payload['message']);
    }

    public function testClassListForbiddenWithoutPermission(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);
        $this->createTestUser($client, 'no_class_scope', 'password', ['ROLE_USER']);
        $loginPayload = $this->login($client, 'no_class_scope', 'password');

        $client->request(
            'POST',
            '/api/schooltask/classes/list',
            [],
            [],
            $this->jsonAuthHeaders($loginPayload['token']),
        );

        self::assertResponseStatusCodeSame(403);
    }

    public function testClassCrudFlow(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);

        $tutor = $this->createTestUser($client, 'class_tutor', 'tutor_password', ['ROLE_USER']);
        $teacher = $this->createTestUser($client, 'class_teacher', 'teacher_password', ['ROLE_USER']);
        $admin = $this->createTestUser($client, 'class_admin', 'admin_password', ['ROLE_SCHOOLTASK_CLASS_ROOT']);
        $this->grantSchooltaskScope($client, $admin, 'schooltask.class', self::SCOPE_ALL);
        $this->grantSchooltaskScope($client, $admin, 'schooltask.subject', self::SCOPE_ALL);

        $parallel = $this->createParallelGroup($client, 'class_5', '5 класс');
        $subject = $this->createSubject($client, 'История', $teacher);

        $loginPayload = $this->login($client, 'class_admin', 'admin_password');
        $headers = $this->jsonAuthHeaders($loginPayload['token']);

        $client->request(
            'POST',
            '/api/schooltask/classes',
            [],
            [],
            $headers,
            json_encode([
                'name' => '5-А',
                'parent_id' => $parallel->getId(),
                'user_id' => $tutor->getId(),
                'sub' => [[
                    'name' => 'История 5-А',
                    'subject_id' => $subject->getId(),
                    'user_id' => $teacher->getId(),
                ]],
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(201);

        /** @var array{id: int, name: string, sub: array<int, array{id: int, subject_id: int}>} $created */
        $created = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('5-А', $created['name']);
        self::assertNotEmpty($created['sub']);
        self::assertSame($subject->getId(), $created['sub'][0]['subject_id']);

        $classId = $created['id'];

        $client->request('GET', '/api/schooltask/classes/'.$classId, [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request(
            'PUT',
            '/api/schooltask/classes/'.$classId,
            [],
            [],
            $headers,
            json_encode([
                'name' => '5-Б',
                'parent_id' => $parallel->getId(),
                'user_id' => $tutor->getId(),
            ], JSON_THROW_ON_ERROR),
        );
        self::assertResponseIsSuccessful();

        /** @var array{name: string} $updated */
        $updated = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('5-Б', $updated['name']);

        $client->request('DELETE', '/api/schooltask/classes/'.$classId, [], [], $headers);
        self::assertResponseIsSuccessful();

        $client->request('GET', '/api/schooltask/classes/'.$classId, [], [], $headers);
        self::assertResponseStatusCodeSame(404);
    }

    public function testCalendarFlowAsTutorTeacherAndPupil(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);

        $tutor = $this->createTestUser($client, 'calendar_tutor', 'tutor_password', ['ROLE_USER']);
        $teacher = $this->createTestUser($client, 'calendar_teacher', 'teacher_password', ['ROLE_USER']);
        $pupil = $this->createTestUser($client, 'calendar_pupil', 'pupil_password', ['ROLE_USER']);

        $this->grantSchooltaskScope($client, $tutor, 'schooltask.event', self::SCOPE_ALL);
        $this->grantSchooltaskScope($client, $teacher, 'schooltask.event', self::SCOPE_ALL);
        $this->grantSchooltaskScope($client, $pupil, 'schooltask.event', self::SCOPE_READ);

        $parallel = $this->createParallelGroup($client, 'class_6', '6 класс');
        $subject = $this->createSubject($client, 'Биология', $teacher);
        $classBundle = $this->createClassWithSubgroup(
            $client,
            $parallel,
            '6-А',
            $tutor,
            $subject,
            $teacher,
            $pupil,
        );

        $tutorLogin = $this->login($client, 'calendar_tutor', 'tutor_password');
        $tutorHeaders = $this->jsonAuthHeaders($tutorLogin['token']);

        $client->request(
            'POST',
            '/api/schooltask/calendar/'.$classBundle['classId'].'/editor/events/add',
            [],
            [],
            $tutorHeaders,
            json_encode([
                'group_id' => $classBundle['subgroupId'],
                'user_id' => $teacher->getId(),
                'start' => '2026-09-01 08:00:00',
                'end' => '2026-09-01 08:40:00',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();

        /** @var array{id: int} $eventPayload */
        $eventPayload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        $eventId = $eventPayload['id'];
        self::assertGreaterThan(0, $eventId);

        $teacherLogin = $this->login($client, 'calendar_teacher', 'teacher_password');
        $teacherHeaders = $this->jsonAuthHeaders($teacherLogin['token']);

        $client->request(
            'POST',
            '/api/schooltask/calendar/teacher/events/save',
            [],
            [],
            $teacherHeaders,
            json_encode([
                'id' => $eventId,
                'theme' => 'Клетка',
                'ht' => 'Параграф 5',
                'pt' => 'Рисунок органоидов',
                'description' => 'Подготовиться к контрольной',
                'netResource' => "https://example.com/bio\nhttps://example.com/cell",
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();

        $pupilLogin = $this->login($client, 'calendar_pupil', 'pupil_password');
        $pupilHeaders = $this->jsonAuthHeaders($pupilLogin['token']);

        $client->request(
            'POST',
            '/api/schooltask/calendar/'.$classBundle['classId'].'/student/events',
            [],
            [],
            $pupilHeaders,
            json_encode([
                'start' => '2026-09-01 00:00:00',
                'end' => '2026-09-07 23:59:59',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseIsSuccessful();

        /** @var list<array{id: int, name: string, color: string}> $events */
        $events = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($events);
        self::assertSame($eventId, $events[0]['id']);
        self::assertSame('green', $events[0]['color']);

        $client->request(
            'GET',
            '/api/schooltask/calendar/'.$classBundle['classId'].'/student/events/'.$eventId,
            [],
            [],
            $pupilHeaders,
        );

        self::assertResponseIsSuccessful();

        /** @var array{theme: string, ht: string, teacher: string, net: list<string>} $detail */
        $detail = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame('Клетка', $detail['theme']);
        self::assertStringContainsString('Параграф 5', $detail['ht']);
        self::assertSame('Test User', $detail['teacher']);
        self::assertCount(2, $detail['net']);
    }

    public function testCalendarAddEventForbiddenForNonTutor(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);

        $tutor = $this->createTestUser($client, 'real_tutor', 'tutor_password', ['ROLE_USER']);
        $teacher = $this->createTestUser($client, 'other_teacher', 'teacher_password', ['ROLE_USER']);
        $intruder = $this->createTestUser($client, 'intruder', 'intruder_password', ['ROLE_USER']);

        $this->grantSchooltaskScope($client, $intruder, 'schooltask.event', self::SCOPE_ALL);

        $parallel = $this->createParallelGroup($client, 'class_7', '7 класс');
        $subject = $this->createSubject($client, 'Химия', $teacher);
        $classBundle = $this->createClassWithSubgroup($client, $parallel, '7-А', $tutor, $subject, $teacher);

        $loginPayload = $this->login($client, 'intruder', 'intruder_password');

        $client->request(
            'POST',
            '/api/schooltask/calendar/'.$classBundle['classId'].'/editor/events/add',
            [],
            [],
            $this->jsonAuthHeaders($loginPayload['token']),
            json_encode([
                'group_id' => $classBundle['subgroupId'],
                'user_id' => $teacher->getId(),
                'start' => '2026-09-02 09:00:00',
                'end' => '2026-09-02 09:40:00',
            ], JSON_THROW_ON_ERROR),
        );

        self::assertResponseStatusCodeSame(400);
    }

    public function testCalendarListClassesRequiresEventReadScope(): void
    {
        $client = static::createClient();
        $this->prepareSchoolTaskDatabase($client);
        $this->createTestUser($client, 'no_event_scope', 'password', ['ROLE_USER']);
        $loginPayload = $this->login($client, 'no_event_scope', 'password');

        $client->request(
            'POST',
            '/api/schooltask/calendar/classes',
            [],
            [],
            $this->jsonAuthHeaders($loginPayload['token']),
        );

        self::assertResponseStatusCodeSame(403);

        /** @var array{message: string} $payload */
        $payload = json_decode($client->getResponse()->getContent(), true, 512, JSON_THROW_ON_ERROR);
        self::assertSame(SchoolTaskAccessMessages::READ_EVENT, $payload['message']);
    }

    protected function prepareSchoolTaskDatabase(KernelBrowser $client): void
    {
        $this->prepareAuthDatabase($client);

        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);
        $metadata = [
            $entityManager->getClassMetadata(EpSubject::class),
            $entityManager->getClassMetadata(StGroup::class),
            $entityManager->getClassMetadata(\SchoolTask\Entity\StGroupUser::class),
            $entityManager->getClassMetadata(EpEvent::class),
        ];

        $schemaTool = new SchemaTool($entityManager);
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);
    }

    protected function grantSchooltaskScope(
        KernelBrowser $client,
        User $user,
        string $code,
        int $level,
    ): void {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);

        $claimant = new Claimant();
        $claimant->setCode($code);
        $claimant->setName($code);

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

    protected function createParallelGroup(KernelBrowser $client, string $code, string $name): StGroup
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);

        $group = new StGroup();
        $group->setCode($code);
        $group->setName($name);
        $group->setSort(100);
        $group->setLevel(0);

        $entityManager->persist($group);
        $entityManager->flush();

        return $group;
    }

    protected function createSubject(KernelBrowser $client, string $name, User $teacher): EpSubject
    {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);

        $subject = new EpSubject();
        $subject->setName($name);
        $subject->setSort(100);
        $subject->addUser($teacher);

        $entityManager->persist($subject);
        $entityManager->flush();

        return $subject;
    }

    /**
     * @return array{classId: int, subgroupId: int}
     */
    protected function createClassWithSubgroup(
        KernelBrowser $client,
        StGroup $parallel,
        string $className,
        User $tutor,
        EpSubject $subject,
        User $teacher,
        ?User $pupil = null,
    ): array {
        /** @var EntityManagerInterface $entityManager */
        $entityManager = $client->getContainer()->get(EntityManagerInterface::class);

        $class = new StGroup();
        $class->setCode('st_class_test_'.uniqid());
        $class->setName($className);
        $class->setParent($parallel);
        $class->setUser($tutor);
        $entityManager->persist($class);

        $subgroup = new StGroup();
        $subgroup->setCode('st_sub_test_'.uniqid());
        $subgroup->setName($subject->getName().' '.$className);
        $subgroup->setParent($class);
        $subgroup->setUser($teacher);
        $subgroup->setSubject($subject);
        $entityManager->persist($subgroup);

        if ($pupil instanceof User) {
            $entityManager->persist($class->newUser($pupil));
        }

        $entityManager->flush();

        return [
            'classId' => (int) $class->getId(),
            'subgroupId' => (int) $subgroup->getId(),
        ];
    }
}
