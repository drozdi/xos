<?php

namespace SchoolTask\Service;

use AbstractManager;
use Main\Entity\Group;
use Main\Entity\User;
use Main\Entity\User\Group as UserGroup;
use Main\Service\MainManager;
use SchoolTask\Entity\EpSubject;
use SchoolTask\Entity\GroupMeta;
use SchoolTask\Repository\EpSubjectRepository;
use SchoolTask\Repository\GroupMetaRepository;
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

    public function getGroupMetaRepository(): GroupMetaRepository
    {
        return $this->getEntityManager()->getRepository(GroupMeta::class);
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
            $userIds = array_map('intval', (array) ($arSubject['users'] ?? $arSubject['user_ids'] ?? []));
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

    public function class(mixed $class = null, ?array $arClass = null): Group
    {
        if (is_int($class) && $class > 0) {
            $class = $this->getClassGroup($class);
        } elseif (is_array($class)) {
            $class = $this->mainManager->group($class);
        }
        if (!($class instanceof Group)) {
            $class = new Group();
        }
        if (empty($arClass)) {
            return $class;
        }

        $arGroup = [
            'name' => $arClass['name'] ?? $class->getName(),
            'parent_id' => $arClass['parent_id'] ?? ($class->getParent()?->getId()),
            'user_id' => $arClass['user_id'] ?? ($class->getUser()?->getId()),
            'sort' => $arClass['sort'] ?? $class->getSort(),
        ];
        if (!(int) $class->getId()) {
            $parentId = (int) ($arGroup['parent_id'] ?? 0);
            $arGroup['code'] = $arClass['code'] ?? sprintf('st_class_%s_%s', $parentId ?: 'new', uniqid());
        } elseif (array_key_exists('code', $arClass)) {
            $arGroup['code'] = $arClass['code'];
        }

        $class = $this->mainManager->group($class, $arGroup);

        if (array_key_exists('users', $arClass)) {
            $this->mainManager->group($class, ['users' => $this->normalizeClassUsers($arClass['users'])]);
        }

        if (array_key_exists('sub', $arClass)) {
            $this->syncSubjectSubgroups($class, (array) $arClass['sub']);
        }

        return $class;
    }

    public function removeClass(Group $class): void
    {
        foreach ($class->getChildren()->toArray() as $child) {
            $meta = $this->getGroupMeta($child);
            if ($meta instanceof GroupMeta) {
                $this->getGroupMetaRepository()->remove($meta);
            }
            $this->mainManager->getGroupRepository()->remove($child);
        }
        $this->mainManager->getGroupRepository()->remove($class, true);
    }

    public function getClassGroup(int $id): ?Group
    {
        $group = $this->mainManager->group($id);
        if (!$group instanceof Group || !(int) $group->getId()) {
            return null;
        }

        return $group;
    }

    public function isClassGroup(Group $group): bool
    {
        $parent = $group->getParent();

        return $parent instanceof Group
            && null === $parent->getParent()
            && str_starts_with((string) $parent->getCode(), 'class_');
    }

    public function isClassTutor(User $user, Group $classGroup): bool
    {
        $tutor = $classGroup->getUser();

        return $tutor instanceof User && (int) $tutor->getId() === (int) $user->getId();
    }

    public function isClassMember(User $user, Group $classGroup): bool
    {
        if ($this->isClassTutor($user, $classGroup)) {
            return true;
        }
        foreach ($classGroup->getUsers() as $userGroup) {
            if ((int) $userGroup->getUserId() === (int) $user->getId()) {
                return true;
            }
        }

        return false;
    }

    /** @return Group[] */
    public function listClasses(): array
    {
        $dql = sprintf(
            'SELECT g FROM %s g JOIN g.parent p WHERE p.code LIKE :code AND p.parent IS NULL ORDER BY p.sort ASC, g.sort ASC, g.name ASC',
            Group::class
        );

        return $this->getEntityManager()->createQuery($dql)
            ->setParameter('code', 'class_%')
            ->getResult();
    }

    /** @return Group[] */
    public function getParallelGroups(): array
    {
        $dql = sprintf(
            'SELECT g FROM %s g WHERE g.code LIKE :code AND g.parent IS NULL ORDER BY g.sort ASC, g.name ASC',
            Group::class
        );

        return $this->getEntityManager()->createQuery($dql)
            ->setParameter('code', 'class_%')
            ->getResult();
    }

    /** @return array<int, array{value: int, text: string}> */
    public function getTutors(): array
    {
        $dql = sprintf(
            'SELECT ug FROM %s ug JOIN ug.group g WHERE g.code = :code',
            UserGroup::class
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

    public function getGroupMeta(Group $group): ?GroupMeta
    {
        return $this->getEntityManager()->find(GroupMeta::class, $group);
    }

    public function getSubjectForGroup(Group $group): ?EpSubject
    {
        return $this->getGroupMeta($group)?->getSubject();
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

    public function serializeClass(Group $class): array
    {
        $users = [];
        foreach ($class->getUsers() as $userGroup) {
            $users[] = [
                'id' => $userGroup->getId(),
                'user_id' => $userGroup->getUserId(),
                'group_id' => $userGroup->getGroupId(),
                'name' => sprintf('%s (%s)', $userGroup->getUserLogin(), $userGroup->getUserAlias()),
            ];
        }

        $sub = [];
        foreach ($class->getChildren() as $child) {
            $meta = $this->getGroupMeta($child);
            $subject = $meta?->getSubject();
            $sub[] = [
                'id' => $child->getId(),
                'group_id' => $child->getId(),
                'name' => $child->getName(),
                'parent_id' => $class->getId(),
                'user_id' => $child->getUser()?->getId(),
                'subject_id' => $subject?->getId(),
                'subject_name' => $subject?->getName(),
            ];
        }

        $data = [
            'id' => $class->getId(),
            'name' => $class->getName(),
            'parent_id' => $class->getParent()?->getId(),
            'user_id' => $class->getUser()?->getId(),
        ];
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

    private function syncSubjectSubgroups(Group $class, array $subRows): void
    {
        $existing = [];
        foreach ($class->getChildren()->toArray() as $child) {
            $existing[(int) $child->getId()] = $child;
        }

        $seen = [];
        foreach ($subRows as $key => $subRow) {
            if (!is_array($subRow)) {
                continue;
            }
            $subId = (int) ($subRow['id'] ?? $subRow['group_id'] ?? 0);
            $subGroup = $existing[$subId] ?? new Group();
            $subjectId = (int) ($subRow['subject_id'] ?? 0);
            $subject = $subjectId > 0 ? $this->subject($subjectId) : null;
            $subName = (string) ($subRow['name'] ?? ($subject?->getName() ?? 'Предмет'));

            $subGroup = $this->mainManager->group($subGroup, [
                'name' => $subName,
                'parent_id' => $class->getId(),
                'user_id' => (int) ($subRow['user_id'] ?? 0) ?: null,
                'code' => $subGroup->getCode() ?: sprintf('st_sub_%d_%s', (int) $class->getId(), uniqid()),
            ]);

            $meta = $this->getGroupMeta($subGroup) ?? (new GroupMeta())->setGroup($subGroup);
            $meta->setSubject($subject);
            $this->getGroupMetaRepository()->save($meta);

            $seen[(int) $subGroup->getId()] = true;
        }

        foreach ($existing as $childId => $child) {
            if (!isset($seen[$childId])) {
                $meta = $this->getGroupMeta($child);
                if ($meta instanceof GroupMeta) {
                    $this->getGroupMetaRepository()->remove($meta);
                }
                $this->mainManager->getGroupRepository()->remove($child);
            }
        }
    }
}
