<?php



namespace SchoolTask\Service;



use AbstractManager;

use Main\Entity\User;

use Main\Service\MainManager;

use SchoolTask\Entity\EpSubject;

use SchoolTask\Entity\EpGroup;

use SchoolTask\Entity\EpGroupUser;

use SchoolTask\Repository\EpSubjectRepository;

use SchoolTask\Repository\EpGroupRepository;

use SchoolTask\Security\SchoolTaskAccessMessages;

use Symfony\Component\Validator\Exception\ValidationFailedException;

use Symfony\Component\Validator\Validator\ValidatorInterface;



class SchoolTaskManager extends AbstractManager

{

    public function __construct(

        ValidatorInterface $validator,

        private readonly MainManager $mainManager,

    ) {

        parent::__construct($validator);

    }



    public function getEpSubjectRepository(): EpSubjectRepository

    {

        return $this->getEntityManager()->getRepository(EpSubject::class);

    }



    public function getEpGroupRepository(): EpGroupRepository

    {

        return $this->getEntityManager()->getRepository(EpGroup::class);

    }



    public function subject(mixed $subject = null, ?array $arSubject = null): EpSubject

    {

        if (is_int($subject) && $subject > 0) {

            $subject = $this->getEpSubjectRepository()->find($subject);

        } elseif (is_array($subject)) {

            $subject = $this->getEpSubjectRepository()->findOneBy($subject);

        }

        if (!($subject instanceof EpSubject)) {

            $subject = new EpSubject();

        }

        if (empty($arSubject)) {

            return $subject;

        }



        if (array_key_exists('name', $arSubject)) {

            $subject->setName((string) $arSubject['name']);

        }

        if (array_key_exists('sort', $arSubject)) {

            $subject->setSort((int) $arSubject['sort'] ?: 100);

        }

        if (array_key_exists('users', $arSubject) || array_key_exists('user_ids', $arSubject)) {
            $userIds = $this->extractSubjectUserIds($arSubject);

            foreach ($subject->getUsers()->toArray() as $user) {

                if (!in_array((int) $user->getId(), $userIds, true)) {

                    $subject->removeUser($user);

                }

            }

            foreach ($userIds as $userId) {

                if ($userId > 0) {

                    $subject->addUser($this->mainManager->user($userId));

                }

            }

        }



        $errors = $this->getValidator()->validate($subject);

        if (count($errors) > 0) {

            throw new ValidationFailedException($arSubject, $errors);

        }

        $this->getEpSubjectRepository()->save($subject, true);



        return $subject;

    }



    public function removeSubject(EpSubject $subject): void

    {

        $this->getEpSubjectRepository()->remove($subject, true);

    }



    public function group(mixed $group = null, ?array $arGroup = null): EpGroup

    {

        if (is_int($group) && $group > 0) {

            $group = $this->getEpGroup($group);

        }

        if (!($group instanceof EpGroup)) {

            $group = new EpGroup();

        }

        if (empty($arGroup)) {

            return $group;

        }



        if (array_key_exists('name', $arGroup)) {

            $group->setName((string) $arGroup['name']);

        }

        if (array_key_exists('sort', $arGroup)) {

            $group->setSort((int) ($arGroup['sort'] ?? 100) ?: 100);

        }

        if (array_key_exists('description', $arGroup)) {

            $group->setDescription($arGroup['description']);

        }

        if (array_key_exists('parent_id', $arGroup)) {

            $parentId = (int) $arGroup['parent_id'];

            $group->setParent($parentId > 0 ? $this->getEpGroup($parentId) : null);

        }

        if (array_key_exists('user_id', $arGroup)) {

            $userId = (int) $arGroup['user_id'];

            $group->setUser($userId > 0 ? $this->mainManager->user($userId) : null);

        }

        if (array_key_exists('subject_id', $arGroup)) {

            $subjectId = (int) $arGroup['subject_id'];

            $group->setSubject($subjectId > 0 ? $this->subject($subjectId) : null);

        }

        if (array_key_exists('graduated', $arGroup)) {

            $group->setGraduated((bool) $arGroup['graduated']);

        }

        if (array_key_exists('graduated_year', $arGroup)) {

            $year = $arGroup['graduated_year'];

            $group->setGraduatedYear(null !== $year && '' !== $year ? (int) $year : null);

        }

        if (!(int) $group->getId()) {

            $parentId = (int) ($arGroup['parent_id'] ?? 0);

            $group->setCode((string) ($arGroup['code'] ?? sprintf('st_group_%s_%s', $parentId ?: 'root', uniqid())));

        } elseif (array_key_exists('code', $arGroup) && '' !== (string) $arGroup['code']) {

            $group->setCode((string) $arGroup['code']);

        }



        $errors = $this->getValidator()->validate($group);

        if (count($errors) > 0) {

            throw new ValidationFailedException($arGroup, $errors);

        }



        $this->getEpGroupRepository()->save($group, true);



        if (array_key_exists('users', $arGroup)) {

            $this->syncGroupMembers($group, (array) $arGroup['users']);

        }



        return $group;

    }



    public function class(mixed $class = null, ?array $arClass = null): EpGroup

    {

        if (is_int($class) && $class > 0) {

            $class = $this->getClassGroup($class);

        }

        if (!($class instanceof EpGroup)) {

            $class = new EpGroup();

        }

        if (empty($arClass)) {
            return $class;
        }

        $parentId = array_key_exists('parent_id', $arClass)
            ? (int) $arClass['parent_id']
            : (int) ($class->getParent()?->getId() ?? 0);
        if ($parentId <= 0) {
            throw new \InvalidArgumentException('Укажите параллель');
        }
        $parent = $this->getEpGroup($parentId);
        if (!$parent instanceof EpGroup || !$this->isParallelGroup($parent)) {
            throw new \InvalidArgumentException(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);
        }

        $arGroup = [
            'name' => $arClass['name'] ?? $class->getName(),
            'parent_id' => $parentId,
            'user_id' => array_key_exists('user_id', $arClass)
                ? $arClass['user_id']
                : $class->getUser()?->getId(),
            'sort' => $arClass['sort'] ?? $class->getSort(),
            'graduated' => $arClass['graduated'] ?? $class->isGraduated(),
            'graduated_year' => $arClass['graduated_year'] ?? $class->getGraduatedYear(),
        ];

        if (!(int) $class->getId()) {
            $arGroup['code'] = $arClass['code'] ?? sprintf('st_class_%s_%s', $parentId, uniqid());
        } elseif (array_key_exists('code', $arClass)) {
            $arGroup['code'] = $arClass['code'];
        }

        $class = $this->group($class, $arGroup);

        if (array_key_exists('users', $arClass)) {
            $this->syncClassMembers($class, (array) $arClass['users']);
        }

        if (array_key_exists('sub', $arClass)) {
            $this->syncSubjectSubgroups($class, (array) $arClass['sub']);
        }

        return $class;
    }



    public function removeClass(EpGroup $class): void

    {

        foreach ($class->getChildren()->toArray() as $child) {

            $this->getEpGroupRepository()->remove($child);

        }

        $this->getEpGroupRepository()->remove($class, true);

    }



    public function getEpGroup(int $id): ?EpGroup

    {

        $group = $this->getEpGroupRepository()->find($id);



        return $group instanceof EpGroup ? $group : null;

    }



    public function getClassGroup(int $id): ?EpGroup

    {

        return $this->getEpGroup($id);

    }



    public function isParallelGroup(EpGroup $group): bool

    {

        return null === $group->getParent();

    }



    public function isClassGroup(EpGroup $group): bool

    {

        $parent = $group->getParent();



        return $parent instanceof EpGroup

            && $this->isParallelGroup($parent)

            && !$group->getSubject() instanceof EpSubject;

    }



    public function isParallelSubjectGroup(EpGroup $group): bool

    {

        $parent = $group->getParent();



        return $parent instanceof EpGroup

            && $this->isParallelGroup($parent)

            && $group->getSubject() instanceof EpSubject;

    }



    public function isClassSubjectGroup(EpGroup $group): bool

    {

        $parent = $group->getParent();



        return $parent instanceof EpGroup

            && $this->isClassGroup($parent)

            && $group->getSubject() instanceof EpSubject;

    }



    /** @return 'parallel'|'class'|'parallel_subject'|'class_subject'|null */

    public function getGroupKind(EpGroup $group): ?string

    {

        if ($this->isParallelGroup($group)) {

            return 'parallel';

        }

        if ($this->isClassGroup($group)) {

            return 'class';

        }

        if ($this->isParallelSubjectGroup($group)) {

            return 'parallel_subject';

        }

        if ($this->isClassSubjectGroup($group)) {

            return 'class_subject';

        }



        return null;

    }



    public function getParallelOfGroup(EpGroup $group): ?EpGroup

    {

        if ($this->isParallelGroup($group)) {

            return $group;

        }

        $parent = $group->getParent();

        if ($parent instanceof EpGroup) {

            if ($this->isParallelGroup($parent)) {

                return $parent;

            }

            $grandParent = $parent->getParent();

            if ($grandParent instanceof EpGroup && $this->isParallelGroup($grandParent)) {

                return $grandParent;

            }

        }



        return null;

    }



    public function getPupilClassId(int $userId): ?int
    {
        $dql = sprintf(
            'SELECT gu FROM %s gu JOIN gu.group g JOIN g.parent p WHERE gu.user = :userId AND p.parent IS NULL AND g.subject IS NULL AND g.graduated = false',
            EpGroupUser::class
        );
        $groupUser = $this->getEntityManager()->createQuery($dql)
            ->setParameter('userId', $userId)
            ->setMaxResults(1)
            ->getOneOrNullResult();

        return $groupUser instanceof EpGroupUser ? (int) $groupUser->getGroupId() : null;
    }



    /** @return int[] */

    public function getStudentIdsInParallel(EpGroup $parallel): array

    {

        if (!$this->isParallelGroup($parallel)) {

            return [];

        }

        $ids = [];

        foreach ($parallel->getChildren() as $class) {

            if (!$this->isClassGroup($class)) {

                continue;

            }

            foreach ($class->getUsers() as $groupUser) {

                $ids[] = (int) $groupUser->getUserId();

            }

        }



        return array_values(array_unique($ids));

    }



    public function assertStudentSingleClass(int $userId, int $classId): void

    {

        $existingClassId = $this->getPupilClassId($userId);

        if (null !== $existingClassId && $existingClassId !== $classId) {

            throw new \InvalidArgumentException(SchoolTaskAccessMessages::PUPIL_ALREADY_IN_CLASS);

        }

    }



    /** @param int[] $userIds */

    public function assertStudentsInParallel(array $userIds, EpGroup $parallel): void

    {

        $allowed = array_flip($this->getStudentIdsInParallel($parallel));

        foreach ($userIds as $userId) {

            if (!isset($allowed[$userId])) {

                throw new \InvalidArgumentException(SchoolTaskAccessMessages::PUPIL_NOT_IN_PARALLEL);

            }

        }

    }



    public function syncClassMembers(EpGroup $class, array $users): void
    {
        $parent = $class->getParent();
        if (!$parent instanceof EpGroup) {
            throw new \InvalidArgumentException('Укажите параллель');
        }
        if (!$this->isParallelGroup($parent)) {
            throw new \InvalidArgumentException(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);
        }
        if ($class->getSubject() instanceof EpSubject) {
            throw new \InvalidArgumentException(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }

        $normalized = $this->normalizeClassUsers($users);
        foreach ($normalized as $row) {
            $userId = (int) ($row['user_id'] ?? 0);
            if ($userId > 0) {
                $this->assertStudentSingleClass($userId, (int) $class->getId());
            }
        }
        $this->syncGroupMembers($class, $normalized);
    }




    public function syncSubjectGroupMembers(EpGroup $group, array $users): void

    {

        $this->syncGroupMembers($group, $this->normalizeClassUsers($users));

    }



    public function syncParallelSubjectGroupMembers(EpGroup $group, array $users): void

    {

        if (!$this->isParallelSubjectGroup($group)) {

            throw new \InvalidArgumentException(SchoolTaskAccessMessages::GROUP_NOT_FOUND);

        }

        $parallel = $group->getParent();

        $normalized = $this->normalizeClassUsers($users);

        $userIds = array_values(array_filter(array_map(

            static fn (array $row): int => (int) ($row['user_id'] ?? 0),

            $normalized

        )));

        if ($parallel instanceof EpGroup) {

            $this->assertStudentsInParallel($userIds, $parallel);

        }

        $this->syncGroupMembers($group, $normalized);

    }



    /** @return EpGroup[] */
    public function listParallels(): array
    {
        return $this->getParallelGroups();
    }

    public function createParallel(array $arParallel): EpGroup
    {
        $name = trim((string) ($arParallel['name'] ?? ''));
        if ('' === $name) {
            throw new \InvalidArgumentException('Укажите название параллели');
        }

        $sort = (int) ($arParallel['sort'] ?? 100) ?: 100;
        if (array_key_exists('code', $arParallel) && '' !== trim((string) $arParallel['code'])) {
            $code = trim((string) $arParallel['code']);
        } elseif (preg_match('/^(\d+)/', $name, $matches)) {
            $code = sprintf('parallel_%d_%s', (int) $matches[1], uniqid());
        } else {
            $code = sprintf('parallel_%s', uniqid());
        }

        return $this->group(null, [
            'name' => $name,
            'parent_id' => null,
            'sort' => $sort,
            'code' => $code,
        ]);
    }

    public function serializeParallel(EpGroup $parallel): array
    {

        $sub = [];

        foreach ($parallel->getChildren() as $child) {

            if ($this->isParallelSubjectGroup($child)) {

                $sub[] = $this->serializeSubjectGroup($child);

            }

        }



        return [

            'id' => $parallel->getId(),

            'name' => $parallel->getName(),

            'sub' => $sub,

        ];

    }



    public function serializeSubjectGroup( $group): array

    {

        $subject = $group->getSubject();

        $users = [];

        foreach ($group->getUsers() as $groupUser) {

            $users[] = [

                'id' => $groupUser->getId(),

                'user_id' => $groupUser->getUserId(),

                'group_id' => $groupUser->getGroupId(),

                'name' => sprintf('%s (%s)', $groupUser->getUserLogin(), $groupUser->getUserAlias()),

            ];

        }



        return [

            'id' => $group->getId(),

            'group_id' => $group->getId(),

            'name' => $group->getName(),

            'parent_id' => $group->getParent()?->getId(),

            'user_id' => $group->getUser()?->getId(),

            'subject_id' => $subject?->getId(),

            'subject_name' => $subject?->getName(),

            'users' => $users,

        ];

    }



    public function syncParallelSubjectGroups(EpGroup $parallel, array $subRows): void

    {

        if (!$this->isParallelGroup($parallel)) {

            throw new \InvalidArgumentException(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);

        }



        $existing = [];

        foreach ($parallel->getChildren()->toArray() as $child) {

            if ($this->isParallelSubjectGroup($child)) {

                $existing[(int) $child->getId()] = $child;

            }

        }



        $seen = [];

        foreach ($subRows as $subRow) {

            if (!is_array($subRow)) {

                continue;

            }

            $subId = (int) ($subRow['id'] ?? $subRow['group_id'] ?? 0);

            $subGroup = $existing[$subId] ?? new EpGroup();

            $subjectId = (int) ($subRow['subject_id'] ?? 0);



            $subGroup = $this->group($subGroup, [

                'name' => (string) ($subRow['name'] ?? ($subjectId > 0 ? $this->subject($subjectId)->getName() : 'Предмет')),

                'parent_id' => $parallel->getId(),

                'user_id' => (int) ($subRow['user_id'] ?? 0) ?: null,

                'subject_id' => $subjectId ?: null,

                'code' => $subGroup->getCode() ?: sprintf('st_sub_par_%d_%s', (int) $parallel->getId(), uniqid()),

            ]);



            if (array_key_exists('users', $subRow) && is_array($subRow['users'])) {

                $this->syncParallelSubjectGroupMembers($subGroup, $subRow['users']);

            }



            $seen[(int) $subGroup->getId()] = true;

        }



        foreach ($existing as $childId => $child) {

            if (!isset($seen[$childId])) {

                $this->getEpGroupRepository()->remove($child);

            }

        }

    }



    public function isClassTutor(User $user, EpGroup $classGroup): bool

    {

        $tutor = $classGroup->getUser();



        return $tutor instanceof User && (int) $tutor->getId() === (int) $user->getId();

    }



    public function isClassMember(User $user, EpGroup $classGroup): bool

    {

        if ($this->isClassTutor($user, $classGroup)) {

            return true;

        }



        return $classGroup->isMember($user);

    }



    /** @return EpGroup[] */

    public function listClasses(bool $includeGraduated = false): array

    {

        $classes = [];

        foreach ($this->listClassesQuery()->getResult() as $class) {

            if (!$class instanceof EpGroup) {

                continue;

            }

            if (!$includeGraduated && $class->isGraduated()) {

                continue;

            }

            $classes[] = $class;

        }



        return $classes;

    }



    public function isClassGraduated(EpGroup $class): bool

    {

        return $class->isGraduated();

    }



    public function promoteClass(EpGroup $class): EpGroup

    {

        if (!$this->isClassGroup($class)) {

            throw new \InvalidArgumentException(SchoolTaskAccessMessages::CLASS_NOT_FOUND);

        }

        if ($class->isGraduated()) {

            throw new \InvalidArgumentException('Класс уже выпущен');

        }

        $parallel = $class->getParent();

        if ($parallel instanceof EpGroup && $this->shouldGraduateParallel($parallel)) {

            return $this->graduateClass($class);

        }



        $name = $class->getName();

        if (preg_match('/^(\d+)(.*)$/', $name, $matches)) {

            $class->setName(((int) $matches[1] + 1).($matches[2] ?? ''));

            $this->getEpGroupRepository()->save($class, true);

        }



        return $class;

    }



    public function promoteParallel(EpGroup $parallel): void

    {

        if (!$this->isParallelGroup($parallel)) {

            throw new \InvalidArgumentException(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);

        }

        if ($this->shouldGraduateParallel($parallel)) {

            $this->graduateParallel($parallel);



            return;

        }

        foreach ($parallel->getChildren()->toArray() as $class) {

            if ($this->isClassGroup($class) && !$class->isGraduated()) {

                $this->promoteClass($class);

            }

        }

    }



    public function graduateClass(EpGroup $class): EpGroup
    {
        if (!$this->isClassGroup($class)) {
            throw new \InvalidArgumentException(SchoolTaskAccessMessages::CLASS_NOT_FOUND);
        }
        if ($class->isGraduated()) {
            throw new \InvalidArgumentException('Класс уже выпущен');
        }
        if (!$this->shouldGraduateClass($class)) {
            throw new \InvalidArgumentException('Выпуск доступен только для параллелей 9 и 11');
        }
        $year = (int) date('Y');
        $class->setGraduated(true)->setGraduatedYear($year);

        $name = $class->getName();
        if (!str_contains($name, (string) $year)) {
            $class->setName(trim($name).' ('.$year.')');
        }
        $this->getEpGroupRepository()->save($class, true);

        return $class;
    }

    public function graduateParallel(EpGroup $parallel): void
    {
        if (!$this->isParallelGroup($parallel)) {
            throw new \InvalidArgumentException(SchoolTaskAccessMessages::PARALLEL_NOT_FOUND);
        }
        if (!$this->shouldGraduateParallel($parallel)) {
            throw new \InvalidArgumentException('Выпуск доступен только для параллелей 9 и 11');
        }
        foreach ($parallel->getChildren()->toArray() as $class) {
            if ($this->isClassGroup($class) && !$class->isGraduated()) {
                $this->graduateClass($class);
            }
        }
    }



    public function shouldGraduateParallel(EpGroup $parallel): bool
    {
        $level = $this->getParallelGradeLevel($parallel);

        return 9 === $level || 11 === $level;
    }

    public function shouldGraduateClass(EpGroup $class): bool
    {
        if (!$this->isClassGroup($class) || $class->isGraduated()) {
            return false;
        }
        $parallel = $class->getParent();

        return $parallel instanceof EpGroup && $this->shouldGraduateParallel($parallel);
    }

    public function getParallelGradeLevel(EpGroup $parallel): ?int
    {
        if (!$this->isParallelGroup($parallel)) {
            return null;
        }
        $code = $parallel->getCode();
        if (preg_match('/(?:class_|parallel_)(\d+)/', $code, $matches)) {
            return (int) $matches[1];
        }
        $name = $parallel->getName();
        if (preg_match('/^(\d+)/', $name, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    private function listClassesQuery(): \Doctrine\ORM\Query
    {

        $dql = sprintf(

            'SELECT g FROM %s g JOIN g.parent p WHERE p.parent IS NULL AND g.subject IS NULL ORDER BY p.sort ASC, g.sort ASC, g.name ASC',

            EpGroup::class

        );



        return $this->getEntityManager()->createQuery($dql);

    }



    /** @return EpGroup[] */

    public function getParallelGroups(): array

    {

        $dql = sprintf(

            'SELECT g FROM %s g WHERE g.parent IS NULL ORDER BY g.sort ASC, g.name ASC',

            EpGroup::class

        );



        return $this->getEntityManager()->createQuery($dql)->getResult();

    }



    /** @return array<int, array{value: int, text: string}> */

    public function getTutors(): array

    {

        $dql = sprintf(

            'SELECT gu FROM %s gu JOIN gu.group g WHERE g.code = :code',

            \Main\Entity\User\Group::class

        );

        $result = [];

        foreach ($this->getEntityManager()->createQuery($dql)->setParameter('code', 'ma_ct')->execute() as $ug) {

            $result[] = [

                'value' => $ug->getUserId(),

                'text' => sprintf('%s (%s)', $ug->getUserLogin(), $ug->getUserAlias()),

            ];

        }



        return $result;

    }



    /** @return array<int, array{value: int, text: string}> */

    public function getPupils(): array

    {

        $dql = sprintf(

            'SELECT u FROM %s u JOIN u.ou ou WHERE ou.code = :code ORDER BY u.login ASC',

            User::class

        );

        $result = [];

        foreach ($this->getEntityManager()->createQuery($dql)->setParameter('code', 'pupils')->execute() as $user) {

            $result[] = [

                'value' => $user->getId(),

                'text' => sprintf('%s (%s)', $user->getLogin(), $user->getAlias()),

            ];

        }



        return $result;

    }



    /** @return User[] */

    public function getTeachersForSubject(EpSubject $subject): array

    {

        return $subject->getUsers()->toArray();

    }



    public function getSubjectForGroup(EpGroup $group): ?EpSubject

    {

        return $group->getSubject();

    }



    /** @return array<int, array{value: int, text: string, users: array}> */

    public function getSubjectsOptions(): array

    {

        $result = [];

        foreach ($this->getEpSubjectRepository()->findFilter([], [['key' => 'sort', 'order' => 'ASC'], ['key' => 'name', 'order' => 'ASC']]) as $subject) {

            $users = [];

            foreach ($subject->getUsers() as $user) {

                $users[] = [

                    'value' => $user->getId(),

                    'text' => sprintf('%s (%s)', $user->getAlias(), $user->getLogin()),

                ];

            }

            $result[] = [

                'value' => $subject->getId(),

                'text' => $subject->getName(),

                'users' => $users,

            ];

        }



        return $result;

    }



    public function serializeClass(EpGroup $class): array

    {

        $users = [];

        foreach ($class->getUsers() as $groupUser) {

            $users[] = [

                'id' => $groupUser->getId(),

                'user_id' => $groupUser->getUserId(),

                'group_id' => $groupUser->getGroupId(),

                'name' => sprintf('%s (%s)', $groupUser->getUserLogin(), $groupUser->getUserAlias()),

            ];

        }



        $sub = [];

        foreach ($class->getChildren() as $child) {

            if ($this->isClassSubjectGroup($child)) {

                $sub[] = $this->serializeSubjectGroup($child);

            }

        }



        $data = [

            'id' => $class->getId(),

            'name' => $class->getName(),

            'parent_id' => $class->getParent()?->getId(),

            'user_id' => $class->getUser()?->getId(),

            'graduated' => $class->isGraduated(),

        ];

        if (null !== $class->getGraduatedYear()) {

            $data['graduated_year'] = $class->getGraduatedYear();

        }

        if ([] !== $users) {

            $data['users'] = $users;

        }

        if ([] !== $sub) {

            $data['sub'] = $sub;

        }



        return $data;

    }



    public function translit(string $value): string

    {

        $map = [

            'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'е' => 'e', 'ё' => 'e',

            'ж' => 'zh', 'з' => 'z', 'и' => 'i', 'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm',

            'н' => 'n', 'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'у' => 'u',

            'ф' => 'f', 'х' => 'h', 'ц' => 'c', 'ч' => 'ch', 'ш' => 'sh', 'щ' => 'sch', 'ъ' => '',

            'ы' => 'y', 'ь' => '', 'э' => 'e', 'ю' => 'yu', 'я' => 'ya',

        ];

        $value = mb_strtolower(trim($value));

        $value = strtr($value, $map);

        $value = preg_replace('/[^a-z0-9._-]+/u', '_', $value) ?? '';

        $value = trim($value, '_');



        return $value ?: 'item';
    }

    /** @return int[] */
    private function extractSubjectUserIds(array $arSubject): array
    {
        if (array_key_exists('user_ids', $arSubject) && is_array($arSubject['user_ids'])) {
            return array_values(array_unique(array_filter(
                array_map('intval', $arSubject['user_ids']),
                static fn (int $id): bool => $id > 0
            )));
        }

        $ids = [];
        foreach ((array) ($arSubject['users'] ?? []) as $key => $userRow) {
            if (is_array($userRow)) {
                $id = (int) ($userRow['user_id'] ?? $userRow['id'] ?? $key);
            } elseif (is_numeric($userRow)) {
                $id = (int) $userRow;
            } elseif (is_numeric($key)) {
                $id = (int) $key;
            } else {
                continue;
            }
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return array_values(array_unique($ids));
    }

    private function normalizeClassUsers(array $users): array
    {

        $normalized = [];

        foreach ($users as $key => $userRow) {

            if (!is_array($userRow)) {

                continue;

            }

            $id = (int) ($userRow['id'] ?? $key);

            $normalized[$id] = [

                'id' => $id,

                'user_id' => (int) ($userRow['user_id'] ?? 0),

            ];

        }



        return $normalized;

    }



    private function syncGroupMembers(EpGroup $group, array $users): void

    {

        $normalized = $this->normalizeClassUsers($users);

        $wantedUserIds = array_values(array_filter(array_map(

            static fn (array $row): int => (int) ($row['user_id'] ?? 0),

            $normalized

        )));



        foreach ($group->getUsers()->toArray() as $groupUser) {

            if (!in_array((int) $groupUser->getUserId(), $wantedUserIds, true)) {

                $group->removeUser($groupUser);

                $this->getEntityManager()->remove($groupUser);

            }

        }



        $existingUserIds = [];

        foreach ($group->getUsers() as $groupUser) {

            $existingUserIds[] = (int) $groupUser->getUserId();

        }



        foreach ($wantedUserIds as $userId) {

            if (!in_array($userId, $existingUserIds, true)) {

                $group->newUser($this->mainManager->user($userId));

            }

        }



        $this->getEpGroupRepository()->save($group, true);

    }



    private function syncSubjectSubgroups( $class, array $subRows): void

    {

        $existing = [];

        foreach ($class->getChildren()->toArray() as $child) {

            $existing[(int) $child->getId()] = $child;

        }



        $seen = [];

        foreach ($subRows as $subRow) {

            if (!is_array($subRow)) {

                continue;

            }

            $subId = (int) ($subRow['id'] ?? $subRow['group_id'] ?? 0);

            $subGroup = $existing[$subId] ?? new EpGroup();

            $subjectId = (int) ($subRow['subject_id'] ?? 0);



            $subGroup = $this->group($subGroup, [

                'name' => (string) ($subRow['name'] ?? ($subjectId > 0 ? $this->subject($subjectId)->getName() : 'Предмет')),

                'parent_id' => $class->getId(),

                'user_id' => (int) ($subRow['user_id'] ?? 0) ?: null,

                'subject_id' => $subjectId ?: null,

                'code' => $subGroup->getCode() ?: sprintf('st_sub_%d_%s', (int) $class->getId(), uniqid()),

            ]);



            if (array_key_exists('users', $subRow) && is_array($subRow['users'])) {

                $this->syncSubjectGroupMembers($subGroup, $subRow['users']);

            }



            $seen[(int) $subGroup->getId()] = true;

        }



        foreach ($existing as $childId => $child) {

            if (!isset($seen[$childId])) {

                $this->getEpGroupRepository()->remove($child);

            }

        }

    }

}


