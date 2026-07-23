<?php

namespace Todo\Service;

use AbstractManager;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Todo\Entity\TodoItem;
use Todo\Entity\TodoList;
use Todo\Entity\TodoListShare;
use Todo\Repository\TodoListRepository;

class TodoManager extends AbstractManager
{
    private const COLORS = [
        '#fff59d',
        '#ffcc80',
        '#ef9a9a',
        '#ce93d8',
        '#90caf9',
        '#a5d6a7',
        '#e0e0e0',
        '#ffffff',
    ];

    public function __construct(
        ValidatorInterface $validator,
        private readonly TodoMarkdownSync $markdownSync,
    ) {
        parent::__construct($validator);
    }

    public function getListRepository(): TodoListRepository
    {
        return $this->getEntityManager()->getRepository(TodoList::class);
    }

    /** @return list<array<string, mixed>> */
    public function listForUser(User $user): array
    {
        $lists = $this->getListRepository()->findAccessibleForUser($user);

        return array_map(fn (TodoList $list) => $this->serializeListSummary($list, $user), $lists);
    }

    public function getAccessibleList(int $id, User $user): TodoList
    {
        $list = $this->getListRepository()->find($id);
        if (!$list instanceof TodoList) {
            throw new NotFoundHttpException('Список не найден');
        }
        if (!$this->canRead($list, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к списку');
        }

        return $list;
    }

    public function createList(User $user, array $data): TodoList
    {
        $list = new TodoList();
        $list->setOwner($user);
        $list->setTitle(trim((string) ($data['title'] ?? 'Без названия')) ?: 'Без названия');
        $list->setColor($this->normalizeColor($data['color'] ?? null));

        if (!empty($data['markdown']) && is_string($data['markdown'])) {
            $parsed = $this->markdownSync->parseMarkdown($data['markdown']);
            $this->markdownSync->applyParsedItems($list, $parsed['items']);
            $list->setNotesMd($parsed['notes_md']);
        } elseif (!empty($data['items']) && is_array($data['items'])) {
            $this->replaceItemsFromArray($list, $data['items']);
            if (array_key_exists('notes_md', $data)) {
                $list->setNotesMd(null !== $data['notes_md'] ? (string) $data['notes_md'] : null);
            }
        }

        $em = $this->getEntityManager();
        $em->persist($list);
        $em->flush();

        return $list;
    }

    public function updateList(TodoList $list, User $user, array $data): TodoList
    {
        if (!$this->canWrite($list, $user)) {
            throw new AccessDeniedHttpException('Нет прав на изменение списка');
        }

        if (array_key_exists('title', $data)) {
            $title = trim((string) $data['title']);
            $list->setTitle('' !== $title ? $title : 'Без названия');
        }
        if (array_key_exists('color', $data)) {
            $list->setColor($this->normalizeColor($data['color']));
        }

        if (array_key_exists('markdown', $data) && is_string($data['markdown'])) {
            $parsed = $this->markdownSync->parseMarkdown($data['markdown']);
            $this->markdownSync->applyParsedItems($list, $parsed['items']);
            $list->setNotesMd($parsed['notes_md']);
        } else {
            if (array_key_exists('items', $data) && is_array($data['items'])) {
                $this->replaceItemsFromArray($list, $data['items']);
            }
            if (array_key_exists('notes_md', $data)) {
                $list->setNotesMd(null !== $data['notes_md'] ? (string) $data['notes_md'] : null);
            }
        }

        $this->getEntityManager()->flush();

        return $list;
    }

    public function deleteList(TodoList $list, User $user): void
    {
        if (!$this->isOwner($list, $user)) {
            throw new AccessDeniedHttpException('Удалить список может только владелец');
        }
        $em = $this->getEntityManager();
        $em->remove($list);
        $em->flush();
    }

    public function shareList(TodoList $list, User $owner, string $email, string $permission): TodoListShare
    {
        if (!$this->isOwner($list, $owner)) {
            throw new AccessDeniedHttpException('Делиться может только владелец');
        }
        $permission = strtolower(trim($permission));
        if (!in_array($permission, [TodoListShare::PERMISSION_READ, TodoListShare::PERMISSION_WRITE], true)) {
            throw new BadRequestHttpException('permission: read или write');
        }

        $email = trim($email);
        if ('' === $email) {
            throw new BadRequestHttpException('Укажите email');
        }

        /** @var UserRepository $users */
        $users = $this->getEntityManager()->getRepository(User::class);
        $target = $users->findOneBy(['email' => $email]);
        if (!$target instanceof User) {
            throw new NotFoundHttpException('Пользователь с таким email не найден');
        }
        if ($target->getId() === $owner->getId()) {
            throw new BadRequestHttpException('Нельзя поделиться с самим собой');
        }

        foreach ($list->getShares() as $existing) {
            if ($existing->getUser()?->getId() === $target->getId()) {
                $existing->setPermission($permission);
                $this->getEntityManager()->flush();

                return $existing;
            }
        }

        $share = new TodoListShare();
        $share->setUser($target);
        $share->setPermission($permission);
        $list->addShare($share);
        $this->getEntityManager()->persist($share);
        $this->getEntityManager()->flush();

        return $share;
    }

    public function unshareList(TodoList $list, User $owner, int $userId): void
    {
        if (!$this->isOwner($list, $owner)) {
            throw new AccessDeniedHttpException('Управлять доступом может только владелец');
        }
        foreach ($list->getShares() as $share) {
            if ($share->getUser()?->getId() === $userId) {
                $list->removeShare($share);
                $this->getEntityManager()->remove($share);
                $this->getEntityManager()->flush();

                return;
            }
        }

        throw new NotFoundHttpException('Доступ не найден');
    }

    /** @return array<string, mixed>|null */
    public function findUserByEmail(string $email): ?array
    {
        $email = trim($email);
        if ('' === $email) {
            return null;
        }
        /** @var UserRepository $users */
        $users = $this->getEntityManager()->getRepository(User::class);
        $user = $users->findOneBy(['email' => $email]);
        if (!$user instanceof User) {
            return null;
        }

        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'alias' => $user->getAlias(),
            'login' => $user->getLogin(),
        ];
    }

    public function canRead(TodoList $list, User $user): bool
    {
        if ($this->isOwner($list, $user)) {
            return true;
        }
        foreach ($list->getShares() as $share) {
            if ($share->getUser()?->getId() === $user->getId()) {
                return true;
            }
        }

        return false;
    }

    public function canWrite(TodoList $list, User $user): bool
    {
        if ($this->isOwner($list, $user)) {
            return true;
        }
        foreach ($list->getShares() as $share) {
            if ($share->getUser()?->getId() === $user->getId() && $share->canWrite()) {
                return true;
            }
        }

        return false;
    }

    public function isOwner(TodoList $list, User $user): bool
    {
        return $list->getOwner()?->getId() === $user->getId();
    }

    /** @return array<string, mixed> */
    public function serializeListSummary(TodoList $list, User $viewer): array
    {
        $preview = [];
        foreach ($list->getItems() as $item) {
            if (count($preview) >= 5) {
                break;
            }
            $preview[] = [
                'id' => $item->getId(),
                'text' => $item->getText(),
                'done' => $item->isDone(),
                'due_at' => $item->getDueAt('Y-m-d H:i:s'),
            ];
        }

        return [
            'id' => $list->getId(),
            'title' => $list->getTitle(),
            'color' => $list->getColor(),
            'is_owner' => $this->isOwner($list, $viewer),
            'can_write' => $this->canWrite($list, $viewer),
            'owner' => [
                'id' => $list->getOwner()?->getId(),
                'alias' => $list->getOwner()?->getAlias(),
                'email' => $list->getOwner()?->getEmail(),
            ],
            'items_count' => $list->getItems()->count(),
            'items_preview' => $preview,
            'updated_at' => $list->getXTimestamp('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeListDetail(TodoList $list, User $viewer): array
    {
        $items = [];
        foreach ($list->getItems() as $item) {
            $items[] = $this->serializeItem($item);
        }

        $shares = [];
        if ($this->isOwner($list, $viewer)) {
            foreach ($list->getShares() as $share) {
                $shares[] = [
                    'user_id' => $share->getUser()?->getId(),
                    'alias' => $share->getUser()?->getAlias(),
                    'email' => $share->getUser()?->getEmail(),
                    'permission' => $share->getPermission(),
                ];
            }
        }

        return [
            'id' => $list->getId(),
            'title' => $list->getTitle(),
            'color' => $list->getColor(),
            'notes_md' => $list->getNotesMd(),
            'markdown' => $this->markdownSync->itemsToMarkdown($list),
            'is_owner' => $this->isOwner($list, $viewer),
            'can_write' => $this->canWrite($list, $viewer),
            'owner' => [
                'id' => $list->getOwner()?->getId(),
                'alias' => $list->getOwner()?->getAlias(),
                'email' => $list->getOwner()?->getEmail(),
            ],
            'items' => $items,
            'shares' => $shares,
            'created_at' => $list->getCreatedAt('Y-m-d H:i:s'),
            'updated_at' => $list->getXTimestamp('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeItem(TodoItem $item): array
    {
        return [
            'id' => $item->getId(),
            'text' => $item->getText(),
            'done' => $item->isDone(),
            'due_at' => $item->getDueAt('Y-m-d H:i:s'),
            'position' => $item->getPosition(),
        ];
    }

    private function normalizeColor(mixed $color): string
    {
        if (!is_string($color) || !preg_match('/^#[0-9a-fA-F]{6}$/', $color)) {
            return self::COLORS[0];
        }

        return strtolower($color);
    }

    /** @param list<array<string, mixed>> $rows */
    private function replaceItemsFromArray(TodoList $list, array $rows): void
    {
        foreach ($list->getItems()->toArray() as $existing) {
            $list->removeItem($existing);
        }

        $position = 0;
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $text = trim((string) ($row['text'] ?? ''));
            if ('' === $text) {
                continue;
            }
            $item = new TodoItem();
            $item->setText($text);
            $item->setDone((bool) ($row['done'] ?? false));
            $item->setPosition((int) ($row['position'] ?? $position));
            $dueRaw = $row['due_at'] ?? null;
            if (is_string($dueRaw) && '' !== trim($dueRaw)) {
                try {
                    $item->setDueAt(new \DateTime($dueRaw));
                } catch (\Exception) {
                    $item->setDueAt(null);
                }
            }
            $list->addItem($item);
            ++$position;
        }
    }
}
