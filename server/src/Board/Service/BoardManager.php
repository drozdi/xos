<?php

namespace Board\Service;

use AbstractManager;
use Board\Entity\ActivityLog;
use Board\Entity\Attachment;
use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\BoardMember;
use Board\Entity\Card;
use Board\Entity\Checklist;
use Board\Entity\ChecklistItem;
use Board\Entity\Comment;
use Board\Entity\Label;
use Board\Entity\Workspace;
use Board\Entity\WorkspaceMember;
use Board\Enum\ActivityAction;
use Board\Enum\MemberRole;
use Board\Repository\ActivityLogRepository;
use Board\Repository\AttachmentRepository;
use Board\Repository\BoardListRepository;
use Board\Repository\BoardRepository;
use Board\Repository\CardRepository;
use Board\Repository\ChecklistItemRepository;
use Board\Repository\ChecklistRepository;
use Board\Repository\CommentRepository;
use Board\Repository\LabelRepository;
use Board\Repository\WorkspaceRepository;
use Main\Entity\File as MainFile;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Main\Service\UploadPathResolver;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class BoardManager extends AbstractManager
{
    private const POSITION_GAP = 1024;

    public function __construct(
        ValidatorInterface $validator,
        private readonly PermissionResolver $permissionResolver,
        private readonly ActivityLogger $activityLogger,
        private readonly UploadPathResolver $uploadPathResolver,
        private readonly string $uploadDir,
    ) {
        parent::__construct($validator);
    }

    public function getWorkspaceRepository(): WorkspaceRepository
    {
        return $this->getEntityManager()->getRepository(Workspace::class);
    }

    public function getBoardRepository(): BoardRepository
    {
        return $this->getEntityManager()->getRepository(Board::class);
    }

    public function getBoardListRepository(): BoardListRepository
    {
        return $this->getEntityManager()->getRepository(BoardList::class);
    }

    public function getCardRepository(): CardRepository
    {
        return $this->getEntityManager()->getRepository(Card::class);
    }

    public function getLabelRepository(): LabelRepository
    {
        return $this->getEntityManager()->getRepository(Label::class);
    }

    public function getChecklistRepository(): ChecklistRepository
    {
        return $this->getEntityManager()->getRepository(Checklist::class);
    }

    public function getChecklistItemRepository(): ChecklistItemRepository
    {
        return $this->getEntityManager()->getRepository(ChecklistItem::class);
    }

    public function getCommentRepository(): CommentRepository
    {
        return $this->getEntityManager()->getRepository(Comment::class);
    }

    public function getAttachmentRepository(): AttachmentRepository
    {
        return $this->getEntityManager()->getRepository(Attachment::class);
    }

    public function getActivityLogRepository(): ActivityLogRepository
    {
        return $this->getEntityManager()->getRepository(ActivityLog::class);
    }

    /** @return list<array<string, mixed>> */
    public function listWorkspacesForUser(User $user): array
    {
        $workspaces = $this->getWorkspaceRepository()->findAccessibleForUser($user);

        return array_map(fn (Workspace $ws) => $this->serializeWorkspaceSummary($ws, $user), $workspaces);
    }

    public function getWorkspace(int $id, User $user): Workspace
    {
        $workspace = $this->getWorkspaceRepository()->find($id);
        if (!$workspace instanceof Workspace) {
            throw new NotFoundHttpException('Workspace не найден');
        }
        if (!$this->permissionResolver->canViewWorkspace($workspace, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к workspace');
        }

        return $workspace;
    }

    public function createWorkspace(User $user, array $data): Workspace
    {
        $workspace = new Workspace();
        $workspace->setOwner($user);
        $workspace->setName($this->normalizeName($data['name'] ?? null));
        if (array_key_exists('description', $data)) {
            $workspace->setDescription($this->normalizeNullableText($data['description']));
        }

        $em = $this->getEntityManager();
        $em->persist($workspace);
        $em->flush();

        return $workspace;
    }

    public function updateWorkspace(Workspace $workspace, User $user, array $data): Workspace
    {
        if (!$this->permissionResolver->canEditWorkspace($workspace, $user)) {
            throw new AccessDeniedHttpException('Нет прав на изменение workspace');
        }

        if (array_key_exists('name', $data)) {
            $workspace->setName($this->normalizeName($data['name']));
        }
        if (array_key_exists('description', $data)) {
            $workspace->setDescription($this->normalizeNullableText($data['description']));
        }

        $this->getEntityManager()->flush();

        return $workspace;
    }

    public function deleteWorkspace(Workspace $workspace, User $user): void
    {
        if (!$this->permissionResolver->isWorkspaceOwner($workspace, $user)) {
            throw new AccessDeniedHttpException('Удалить workspace может только владелец');
        }

        $em = $this->getEntityManager();
        $em->remove($workspace);
        $em->flush();
    }

    public function createBoard(Workspace $workspace, User $user, array $data): Board
    {
        if (!$this->permissionResolver->canCreateBoard($workspace, $user)) {
            throw new AccessDeniedHttpException('Нет прав на создание доски');
        }

        $board = new Board();
        $board->setWorkspace($workspace);
        $board->setCreatedBy($user);
        $board->setTitle($this->normalizeTitle($data['title'] ?? null));
        if (array_key_exists('description', $data)) {
            $board->setDescription($this->normalizeNullableText($data['description']));
        }
        if (array_key_exists('background_type', $data)) {
            $board->setBackgroundType($this->normalizeBackgroundType($data['background_type']));
        }
        if (array_key_exists('background_value', $data)) {
            $board->setBackgroundValue(trim((string) $data['background_value']));
        }
        if (array_key_exists('visibility', $data)) {
            $board->setVisibility($this->normalizeVisibility($data['visibility']));
        }

        $em = $this->getEntityManager();
        $em->persist($board);
        $em->flush();

        return $board;
    }

    /** @return list<array<string, mixed>> */
    public function listBoardsForWorkspace(Workspace $workspace, User $user): array
    {
        if (!$this->permissionResolver->canViewWorkspace($workspace, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к workspace');
        }

        $boards = $this->getBoardRepository()->findByWorkspace($workspace);
        $result = [];
        foreach ($boards as $board) {
            if ($this->permissionResolver->canViewBoard($board, $user)) {
                $result[] = $this->serializeBoardSummary($board, $user);
            }
        }

        return $result;
    }

    public function getBoard(int $id, User $user): Board
    {
        $board = $this->getBoardRepository()->find($id);
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canViewBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к доске');
        }

        return $board;
    }

    /**
     * @param array{
     *     assignee_ids?: list<int>,
     *     label_ids?: list<int>,
     *     due_before?: ?string,
     *     due_after?: ?string,
     *     q?: string
     * } $params
     *
     * @return array{card_ids: list<int>, filtered: bool}
     */
    public function filterBoardCards(Board $board, User $user, array $params): array
    {
        if (!$this->permissionResolver->canViewBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к доске');
        }

        $filters = [
            'assignee_ids' => $params['assignee_ids'] ?? [],
            'label_ids' => $params['label_ids'] ?? [],
            'due_before' => $this->parseFilterDate($params['due_before'] ?? null),
            'due_after' => $this->parseFilterDate($params['due_after'] ?? null),
            'q' => trim((string) ($params['q'] ?? '')),
        ];

        $hasFilters = [] !== $filters['assignee_ids']
            || [] !== $filters['label_ids']
            || null !== $filters['due_before']
            || null !== $filters['due_after']
            || '' !== $filters['q'];

        $cardIds = $this->getCardRepository()->findMatchingIdsForBoard($board, $filters);

        return [
            'card_ids' => $cardIds,
            'filtered' => $hasFilters,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function findDueCardsInRange(User $user, \DateTimeInterface $start, \DateTimeInterface $end): array
    {
        $cards = $this->getCardRepository()->findDueInRangeForUser($user, $start, $end);
        $result = [];

        foreach ($cards as $card) {
            $board = $card->getBoard();
            if (null === $board || !$this->permissionResolver->canViewBoard($board, $user)) {
                continue;
            }
            $result[] = $this->serializeCalendarDueCard($card);
        }

        return $result;
    }

    public function updateBoard(Board $board, User $user, array $data): Board
    {
        if (!$this->permissionResolver->canEditBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на изменение доски');
        }

        if (array_key_exists('title', $data)) {
            $board->setTitle($this->normalizeTitle($data['title']));
        }
        if (array_key_exists('description', $data)) {
            $board->setDescription($this->normalizeNullableText($data['description']));
        }
        if (array_key_exists('background_type', $data)) {
            $board->setBackgroundType($this->normalizeBackgroundType($data['background_type']));
        }
        if (array_key_exists('background_value', $data)) {
            $board->setBackgroundValue(trim((string) $data['background_value']));
        }
        if (array_key_exists('visibility', $data)) {
            $board->setVisibility($this->normalizeVisibility($data['visibility']));
        }

        $this->getEntityManager()->flush();

        return $board;
    }

    public function createList(Board $board, User $user, array $data): BoardList
    {
        if (!$this->permissionResolver->canManageLists($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на создание списка');
        }

        $list = new BoardList();
        $list->setBoard($board);
        $list->setTitle($this->normalizeTitle($data['title'] ?? null));
        $list->setOrderIndex($this->nextOrderIndex($board));
        $board->addList($list);

        $em = $this->getEntityManager();
        $em->persist($list);
        $em->flush();

        return $list;
    }

    public function getList(int $id, User $user): BoardList
    {
        $list = $this->getBoardListRepository()->find($id);
        if (!$list instanceof BoardList) {
            throw new NotFoundHttpException('Список не найден');
        }
        $board = $list->getBoard();
        if (!$board instanceof Board || !$this->permissionResolver->canViewBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к списку');
        }

        return $list;
    }

    public function updateList(BoardList $list, User $user, array $data): BoardList
    {
        $board = $list->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canManageLists($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на изменение списка');
        }

        if (array_key_exists('title', $data)) {
            $list->setTitle($this->normalizeTitle($data['title']));
        }
        if (array_key_exists('assignee_id', $data)) {
            $list->setAssignee($this->resolveOptionalUserById($data['assignee_id']));
        }

        $this->getEntityManager()->flush();

        return $list;
    }

    /**
     * Deletes list and all its cards (orphanRemoval cascade on BoardList.cards).
     */
    public function deleteList(BoardList $list, User $user): void
    {
        $board = $list->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canManageLists($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на удаление списка');
        }

        $em = $this->getEntityManager();
        $board->removeList($list);
        $em->remove($list);
        $em->flush();
    }

    /**
     * @param list<array{id: int, order_index: int}> $orders
     */
    public function reorderLists(Board $board, User $user, array $orders): void
    {
        if ([] === $orders) {
            throw new BadRequestHttpException('Укажите orders');
        }

        $em = $this->getEntityManager();
        foreach ($orders as $item) {
            if (!isset($item['id'], $item['order_index'])) {
                throw new BadRequestHttpException('orders: каждый элемент должен содержать id и order_index');
            }
            $list = $this->getBoardListRepository()->find((int) $item['id']);
            if (!$list instanceof BoardList || $list->getBoard()?->getId() !== $board->getId()) {
                throw new NotFoundHttpException('Список не найден на доске');
            }
            if (!$this->canUpdateListOrder($board, $user, $list)) {
                throw new AccessDeniedHttpException('Нет прав на изменение порядка списка');
            }
            $list->setOrderIndex((int) $item['order_index']);
        }

        $em->flush();
    }

    public function createCard(BoardList $list, User $user, array $data): Card
    {
        $board = $list->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canManageCards($board, $user, $list)) {
            throw new AccessDeniedHttpException('Нет прав на создание карточки');
        }

        $card = new Card();
        $card->setList($list);
        $card->setCreatedBy($user);
        $card->setTitle($this->normalizeCardTitle($data['title'] ?? null));
        $card->setPosition($this->nextCardPosition($list));
        $list->addCard($card);

        $em = $this->getEntityManager();
        $em->persist($card);
        $em->flush();

        return $card;
    }

    public function getCard(int $id, User $user): Card
    {
        $card = $this->getCardRepository()->find($id);
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $card->getBoard();
        if (!$board instanceof Board || !$this->permissionResolver->canViewBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к карточке');
        }

        return $card;
    }

    public function updateCard(Card $card, User $user, array $data): Card
    {
        $board = $card->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canManageCards($board, $user, $card->getList(), $card)) {
            throw new AccessDeniedHttpException('Нет прав на изменение карточки');
        }

        if (array_key_exists('title', $data)) {
            $card->setTitle($this->normalizeCardTitle($data['title']));
        }
        if (array_key_exists('description_md', $data)) {
            $card->setDescriptionMd($this->normalizeNullableText($data['description_md']));
        }
        if (array_key_exists('due_date', $data)) {
            $card->setDueDate($this->parseNullableDateTime($data['due_date']));
        }
        if (array_key_exists('cover_color', $data)) {
            $card->setCoverColor($this->normalizeNullableText($data['cover_color']));
        }

        $this->getEntityManager()->flush();

        $tracked = ['title', 'description_md', 'due_date', 'cover_color'];
        $changed = array_values(array_intersect(array_keys($data), $tracked));
        if ([] !== $changed) {
            $this->activityLogger->log(
                $board,
                $card,
                $user,
                ActivityAction::CardUpdated,
                ['fields' => $changed],
            );
            $this->getEntityManager()->flush();
        }

        return $card;
    }

    public function deleteCard(Card $card, User $user): void
    {
        $board = $card->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canManageCards($board, $user, $card->getList(), $card)) {
            throw new AccessDeniedHttpException('Нет прав на удаление карточки');
        }

        $em = $this->getEntityManager();
        $em->remove($card);
        $em->flush();
    }

    public function moveCard(Card $card, User $user, int $listId, int $position): Card
    {
        $board = $card->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }

        $targetList = $this->getBoardListRepository()->find($listId);
        if (!$targetList instanceof BoardList || $targetList->getBoard()?->getId() !== $board->getId()) {
            throw new NotFoundHttpException('Целевой список не найден на доске');
        }

        if (!$this->permissionResolver->canManageCards($board, $user, $card->getList(), $card)
            || !$this->permissionResolver->canManageCards($board, $user, $targetList)) {
            throw new AccessDeniedHttpException('Нет прав на перемещение карточки');
        }

        $fromListId = $card->getList()?->getId();

        $card->setList($targetList);
        $card->setPosition($position);

        $em = $this->getEntityManager();
        $em->flush();

        $this->activityLogger->log(
            $board,
            $card,
            $user,
            ActivityAction::CardMoved,
            [
                'from_list_id' => $fromListId,
                'to_list_id' => $targetList->getId(),
                'position' => $position,
            ],
        );

        if ($this->needsCardRebalance($targetList)) {
            $this->rebalanceCardPositions($targetList);
            $em->flush();
        }

        return $card;
    }

    public function createLabel(Board $board, User $user, array $data): Label
    {
        if (!$this->permissionResolver->canManageLabels($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на создание метки');
        }

        $label = new Label();
        $label->setBoard($board);
        $label->setName($this->normalizeLabelName($data['name'] ?? null));
        $label->setColor($this->normalizeLabelColor($data['color'] ?? null));
        $board->addLabel($label);

        $em = $this->getEntityManager();
        $em->persist($label);
        $em->flush();

        return $label;
    }

    public function getLabel(int $id, User $user): Label
    {
        $label = $this->getLabelRepository()->find($id);
        if (!$label instanceof Label) {
            throw new NotFoundHttpException('Метка не найдена');
        }
        $board = $label->getBoard();
        if (!$board instanceof Board || !$this->permissionResolver->canViewBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к метке');
        }

        return $label;
    }

    public function updateLabel(Label $label, User $user, array $data): Label
    {
        $board = $label->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canManageLabels($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на изменение метки');
        }

        if (array_key_exists('name', $data)) {
            $label->setName($this->normalizeLabelName($data['name']));
        }
        if (array_key_exists('color', $data)) {
            $label->setColor($this->normalizeLabelColor($data['color']));
        }

        $this->getEntityManager()->flush();

        return $label;
    }

    public function deleteLabel(Label $label, User $user): void
    {
        $board = $label->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }
        if (!$this->permissionResolver->canManageLabels($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на удаление метки');
        }

        $em = $this->getEntityManager();
        $board->removeLabel($label);
        $em->remove($label);
        $em->flush();
    }

    public function createChecklist(Card $card, User $user, array $data): Checklist
    {
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $checklist = new Checklist();
        $checklist->setCard($card);
        $checklist->setTitle($this->normalizeChecklistTitle($data['title'] ?? null));
        $checklist->setPosition($this->nextChecklistPosition($card));

        $em = $this->getEntityManager();
        $em->persist($checklist);
        $em->flush();

        return $checklist;
    }

    public function getChecklist(int $id, User $user): Checklist
    {
        $checklist = $this->getChecklistRepository()->find($id);
        if (!$checklist instanceof Checklist) {
            throw new NotFoundHttpException('Чеклист не найден');
        }
        $card = $checklist->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $this->getCard($card->getId(), $user);

        return $checklist;
    }

    public function updateChecklist(Checklist $checklist, User $user, array $data): Checklist
    {
        $card = $checklist->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        if (array_key_exists('title', $data)) {
            $checklist->setTitle($this->normalizeChecklistTitle($data['title']));
        }
        if (array_key_exists('position', $data)) {
            $checklist->setPosition((int) $data['position']);
        }

        $this->getEntityManager()->flush();

        return $checklist;
    }

    public function deleteChecklist(Checklist $checklist, User $user): void
    {
        $card = $checklist->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $em = $this->getEntityManager();
        $em->remove($checklist);
        $em->flush();
    }

    public function addChecklistItem(Checklist $checklist, User $user, array $data): ChecklistItem
    {
        $card = $checklist->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $item = new ChecklistItem();
        $item->setChecklist($checklist);
        $item->setText($this->normalizeChecklistItemText($data['text'] ?? null));
        $item->setPosition($this->nextChecklistItemPosition($checklist));
        $checklist->addItem($item);

        $em = $this->getEntityManager();
        $em->persist($item);
        $em->flush();

        return $item;
    }

    public function getChecklistItem(int $id, User $user): ChecklistItem
    {
        $item = $this->getChecklistItemRepository()->find($id);
        if (!$item instanceof ChecklistItem) {
            throw new NotFoundHttpException('Пункт чеклиста не найден');
        }
        $checklist = $item->getChecklist();
        if (!$checklist instanceof Checklist) {
            throw new NotFoundHttpException('Чеклист не найден');
        }
        $this->getChecklist($checklist->getId(), $user);

        return $item;
    }

    public function updateChecklistItem(ChecklistItem $item, User $user, array $data): ChecklistItem
    {
        $checklist = $item->getChecklist();
        if (!$checklist instanceof Checklist) {
            throw new NotFoundHttpException('Чеклист не найден');
        }
        $card = $checklist->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $wasChecked = $item->isChecked();

        if (array_key_exists('text', $data)) {
            $item->setText($this->normalizeChecklistItemText($data['text']));
        }
        if (array_key_exists('checked', $data)) {
            $item->setChecked((bool) $data['checked']);
        }
        if (array_key_exists('position', $data)) {
            $item->setPosition((int) $data['position']);
        }

        $em = $this->getEntityManager();
        $em->flush();

        if (array_key_exists('checked', $data) && $item->isChecked() !== $wasChecked) {
            $this->activityLogger->log(
                $board,
                $card,
                $user,
                ActivityAction::ChecklistItemChecked,
                [
                    'item_id' => $item->getId(),
                    'checked' => $item->isChecked(),
                    'text' => $item->getText(),
                ],
            );
            $em->flush();
        }

        return $item;
    }

    public function deleteChecklistItem(ChecklistItem $item, User $user): void
    {
        $checklist = $item->getChecklist();
        if (!$checklist instanceof Checklist) {
            throw new NotFoundHttpException('Чеклист не найден');
        }
        $card = $checklist->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $em = $this->getEntityManager();
        $checklist->removeItem($item);
        $em->remove($item);
        $em->flush();
    }

    /** @return list<array<string, mixed>> */
    public function listComments(Card $card, User $user): array
    {
        $this->getCard($card->getId(), $user);
        $comments = $this->getCommentRepository()->findByCardOrdered($card);

        return array_map(fn (Comment $comment) => $this->serializeComment($comment), $comments);
    }

    public function createComment(Card $card, User $user, array $data): Comment
    {
        $board = $this->requireCardBoard($card);
        if (!$this->permissionResolver->canAddComment($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на добавление комментария');
        }

        $comment = new Comment();
        $comment->setCard($card);
        $comment->setUser($user);
        $comment->setText($this->normalizeCommentText($data['text'] ?? null));

        $em = $this->getEntityManager();
        $em->persist($comment);
        $em->flush();

        $this->activityLogger->log(
            $board,
            $card,
            $user,
            ActivityAction::CommentAdded,
            ['comment_id' => $comment->getId()],
        );
        $em->flush();

        return $comment;
    }

    public function getComment(int $id, User $user): Comment
    {
        $comment = $this->getCommentRepository()->find($id);
        if (!$comment instanceof Comment) {
            throw new NotFoundHttpException('Комментарий не найден');
        }
        $card = $comment->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $this->getCard($card->getId(), $user);

        return $comment;
    }

    public function updateComment(Comment $comment, User $user, array $data): Comment
    {
        $card = $comment->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $author = $comment->getUser();
        if (!$author instanceof User || !$this->permissionResolver->canEditComment($board, $user, $author)) {
            throw new AccessDeniedHttpException('Нет прав на изменение комментария');
        }

        if (array_key_exists('text', $data)) {
            $comment->setText($this->normalizeCommentText($data['text']));
        }

        $this->getEntityManager()->flush();

        return $comment;
    }

    public function deleteComment(Comment $comment, User $user): void
    {
        $card = $comment->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $author = $comment->getUser();
        if (!$author instanceof User || !$this->permissionResolver->canDeleteComment($board, $user, $author)) {
            throw new AccessDeniedHttpException('Нет прав на удаление комментария');
        }

        $em = $this->getEntityManager();
        $em->remove($comment);
        $em->flush();
    }

    /** @return list<array<string, mixed>> */
    public function listAttachments(Card $card, User $user): array
    {
        $this->getCard($card->getId(), $user);
        $attachments = $this->getAttachmentRepository()->findByCard($card);

        return array_map(fn (Attachment $attachment) => $this->serializeAttachment($attachment), $attachments);
    }

    public function createAttachmentFromUpload(Card $card, User $user, MainFile $file): Attachment
    {
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $attachment = new Attachment();
        $attachment->setCard($card);
        $attachment->setFileName($file->getOriginalName());
        $attachment->setFileUrl($file->getSubDir().'/'.$file->getFileName());
        $attachment->setMimeType($file->getContentType());
        $attachment->setSizeBytes($file->getFileSize());
        $attachment->setUploadedBy($user);

        $em = $this->getEntityManager();
        $em->persist($attachment);
        $em->remove($file);
        $em->flush();

        return $attachment;
    }

    public function getAttachment(int $id, User $user): Attachment
    {
        $attachment = $this->getAttachmentRepository()->find($id);
        if (!$attachment instanceof Attachment) {
            throw new NotFoundHttpException('Вложение не найдено');
        }
        $card = $attachment->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $this->getCard($card->getId(), $user);

        return $attachment;
    }

    public function deleteAttachment(Attachment $attachment, User $user): void
    {
        $card = $attachment->getCard();
        if (!$card instanceof Card) {
            throw new NotFoundHttpException('Карточка не найдена');
        }
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $this->removeAttachmentFile($attachment);

        $em = $this->getEntityManager();
        $em->remove($attachment);
        $em->flush();
    }

    /** @param list<int> $userIds */
    public function setCardAssignees(Card $card, User $user, array $userIds): Card
    {
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $resolved = $this->resolveUsersByIds($userIds);
        $current = $card->getAssignees()->toArray();
        foreach ($current as $assignee) {
            if (!in_array($assignee, $resolved, true)) {
                $card->removeAssignee($assignee);
            }
        }
        foreach ($resolved as $assignee) {
            $card->addAssignee($assignee);
        }

        $this->getEntityManager()->flush();

        return $card;
    }

    /** @param list<int> $labelIds */
    public function setCardLabels(Card $card, User $user, array $labelIds): Card
    {
        $board = $this->requireCardBoard($card);
        $this->assertCanManageCard($board, $user, $card);

        $labels = [];
        foreach ($labelIds as $labelId) {
            $label = $this->getLabelRepository()->find((int) $labelId);
            if (!$label instanceof Label || $label->getBoard()?->getId() !== $board->getId()) {
                throw new NotFoundHttpException('Метка не найдена на доске');
            }
            $labels[] = $label;
        }

        $current = $card->getLabels()->toArray();
        foreach ($current as $label) {
            if (!in_array($label, $labels, true)) {
                $card->removeLabel($label);
            }
        }
        foreach ($labels as $label) {
            $card->addLabel($label);
        }

        $this->getEntityManager()->flush();

        return $card;
    }

    /** @return list<array<string, mixed>> */
    public function listBoardActivity(Board $board, User $user, int $limit = 50, int $offset = 0): array
    {
        if (!$this->permissionResolver->canViewBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к доске');
        }

        $entries = $this->getActivityLogRepository()->findByBoardOrdered($board, $limit, $offset);

        return array_map(fn ($entry) => $this->serializeActivityLog($entry), $entries);
    }

    public function deleteBoard(Board $board, User $user): void
    {
        if (!$this->permissionResolver->canEditBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет прав на удаление доски');
        }

        $em = $this->getEntityManager();
        $em->remove($board);
        $em->flush();
    }

    /** @return list<array<string, mixed>> */
    public function listWorkspaceMembers(Workspace $workspace, User $user): array
    {
        if (!$this->permissionResolver->canViewWorkspace($workspace, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к workspace');
        }

        return $this->serializeWorkspaceMembers($workspace);
    }

    public function inviteWorkspaceMember(Workspace $workspace, User $inviter, string $email, string $role): WorkspaceMember
    {
        if (!$this->permissionResolver->canManageWorkspaceMembers($workspace, $inviter)) {
            throw new AccessDeniedHttpException('Нет прав на управление участниками');
        }

        $memberRole = $this->parseMemberRole($role);
        $target = $this->resolveUserByEmail($email);
        if ($target->getId() === $workspace->getOwner()?->getId()) {
            throw new BadRequestHttpException('Владелец workspace не добавляется в участники');
        }
        if ($target->getId() === $inviter->getId() && !$this->permissionResolver->isWorkspaceOwner($workspace, $inviter)) {
            throw new BadRequestHttpException('Нельзя пригласить самого себя');
        }

        foreach ($workspace->getMembers() as $existing) {
            if ($existing->getUser()?->getId() === $target->getId()) {
                $existing->setRole($memberRole);
                $this->getEntityManager()->flush();

                return $existing;
            }
        }

        $member = new WorkspaceMember();
        $member->setUser($target);
        $member->setRole($memberRole);
        $member->setInvitedBy($inviter);
        $workspace->addMember($member);

        $em = $this->getEntityManager();
        $em->persist($member);
        $em->flush();

        return $member;
    }

    public function updateWorkspaceMemberRole(Workspace $workspace, User $actor, int $userId, string $role): WorkspaceMember
    {
        if (!$this->permissionResolver->canManageWorkspaceMembers($workspace, $actor)) {
            throw new AccessDeniedHttpException('Нет прав на управление участниками');
        }

        $member = $this->findWorkspaceMember($workspace, $userId);
        $member->setRole($this->parseMemberRole($role));
        $this->getEntityManager()->flush();

        return $member;
    }

    public function removeWorkspaceMember(Workspace $workspace, User $actor, int $userId): void
    {
        if (!$this->permissionResolver->canManageWorkspaceMembers($workspace, $actor)) {
            throw new AccessDeniedHttpException('Нет прав на управление участниками');
        }

        if ($userId === $workspace->getOwner()?->getId()) {
            throw new BadRequestHttpException('Нельзя удалить владельца workspace');
        }

        $member = $this->findWorkspaceMember($workspace, $userId);
        $workspace->removeMember($member);
        $this->getEntityManager()->remove($member);
        $this->getEntityManager()->flush();
    }

    /** @return list<array<string, mixed>> */
    public function listBoardMembers(Board $board, User $user): array
    {
        if (!$this->permissionResolver->canViewBoard($board, $user)) {
            throw new AccessDeniedHttpException('Нет доступа к доске');
        }

        return $this->serializeBoardMembers($board);
    }

    public function addBoardMember(Board $board, User $actor, string $email, string $role): BoardMember
    {
        if (!$this->permissionResolver->canManageBoardMembers($board, $actor)) {
            throw new AccessDeniedHttpException('Нет прав на управление участниками доски');
        }

        $memberRole = $this->parseMemberRole($role);
        $target = $this->resolveUserByEmail($email);
        $workspace = $board->getWorkspace();
        if ($workspace && $target->getId() === $workspace->getOwner()?->getId()) {
            throw new BadRequestHttpException('Владелец workspace уже имеет полный доступ');
        }

        foreach ($board->getMembers() as $existing) {
            if ($existing->getUser()?->getId() === $target->getId()) {
                $existing->setRole($memberRole);
                $this->getEntityManager()->flush();

                return $existing;
            }
        }

        $member = new BoardMember();
        $member->setUser($target);
        $member->setRole($memberRole);
        $board->addMember($member);

        $em = $this->getEntityManager();
        $em->persist($member);
        $em->flush();

        return $member;
    }

    public function updateBoardMemberRole(Board $board, User $actor, int $userId, string $role): BoardMember
    {
        if (!$this->permissionResolver->canManageBoardMembers($board, $actor)) {
            throw new AccessDeniedHttpException('Нет прав на управление участниками доски');
        }

        $member = $this->findBoardMember($board, $userId);
        $member->setRole($this->parseMemberRole($role));
        $this->getEntityManager()->flush();

        return $member;
    }

    public function removeBoardMember(Board $board, User $actor, int $userId): void
    {
        if (!$this->permissionResolver->canManageBoardMembers($board, $actor)) {
            throw new AccessDeniedHttpException('Нет прав на управление участниками доски');
        }

        $member = $this->findBoardMember($board, $userId);
        $board->removeMember($member);
        $this->getEntityManager()->remove($member);
        $this->getEntityManager()->flush();
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

    /** @return array<string, mixed> */
    public function serializeWorkspaceSummary(Workspace $workspace, User $viewer): array
    {
        return [
            'id' => $workspace->getId(),
            'name' => $workspace->getName(),
            'description' => $workspace->getDescription(),
            'is_owner' => $this->permissionResolver->isWorkspaceOwner($workspace, $viewer),
            'role' => $this->resolveWorkspaceRoleLabel($workspace, $viewer),
            'owner' => $this->serializeUserRef($workspace->getOwner()),
            'boards_count' => $workspace->getBoards()->count(),
            'updated_at' => $workspace->getUpdatedAt('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeWorkspaceDetail(Workspace $workspace, User $viewer): array
    {
        return [
            ...$this->serializeWorkspaceSummary($workspace, $viewer),
            'boards' => $this->listBoardsForWorkspace($workspace, $viewer),
            'members' => $this->serializeWorkspaceMembers($workspace),
            'permissions' => [
                'can_edit' => $this->permissionResolver->canEditWorkspace($workspace, $viewer),
                'can_manage_members' => $this->permissionResolver->canManageWorkspaceMembers($workspace, $viewer),
                'can_create_board' => $this->permissionResolver->canCreateBoard($workspace, $viewer),
                'can_delete' => $this->permissionResolver->isWorkspaceOwner($workspace, $viewer),
            ],
            'created_at' => $workspace->getCreatedAt('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeBoardSummary(Board $board, User $viewer): array
    {
        return [
            'id' => $board->getId(),
            'workspace_id' => $board->getWorkspace()?->getId(),
            'title' => $board->getTitle(),
            'description' => $board->getDescription(),
            'background' => [
                'type' => $board->getBackgroundType(),
                'value' => $board->getBackgroundValue(),
            ],
            'visibility' => $board->getVisibility(),
            'role' => $this->permissionResolver->resolveEffectiveBoardRole($board, $viewer),
            'can_delete' => $this->permissionResolver->canEditBoard($board, $viewer),
            'updated_at' => $board->getUpdatedAt('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeBoardDetail(Board $board, User $viewer): array
    {
        $lists = $this->getBoardListRepository()->findByBoardOrdered($board);
        $labels = $this->getLabelRepository()->findByBoard($board);

        return [
            ...$this->serializeBoardSummary($board, $viewer),
            'labels' => array_map(fn (Label $label) => $this->serializeLabel($label), $labels),
            'lists' => array_map(fn (BoardList $list) => $this->serializeList($list), $lists),
            'members' => $this->serializeBoardMembers($board),
            'permissions' => [
                'can_edit' => $this->permissionResolver->canEditBoard($board, $viewer),
                'can_admin' => $this->permissionResolver->canManageBoardMembers($board, $viewer),
                'can_delete' => $this->permissionResolver->canEditBoard($board, $viewer),
            ],
            'created_at' => $board->getCreatedAt('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeList(BoardList $list): array
    {
        $cards = $this->getCardRepository()->findByListOrdered($list);

        return [
            'id' => $list->getId(),
            'title' => $list->getTitle(),
            'order_index' => $list->getOrderIndex(),
            'assignee' => $this->serializeUserRef($list->getAssignee()),
            'cards' => array_map(fn (Card $card) => $this->serializeCardSummary($card), $cards),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeCardSummary(Card $card): array
    {
        return [
            'id' => $card->getId(),
            'title' => $card->getTitle(),
            'position' => $card->getPosition(),
            'due_date' => $this->formatDateTime($card->getDueDate()),
            'cover_color' => $card->getCoverColor(),
            'label_ids' => $this->extractLabelIds($card),
            'assignee_ids' => $this->extractAssigneeIds($card),
        ];
    }

    /** @return array<string, mixed> */
    private function serializeCalendarDueCard(Card $card): array
    {
        $board = $card->getBoard();
        $list = $card->getList();

        return [
            'id' => $card->getId(),
            'board_id' => $board?->getId(),
            'board_title' => $board?->getTitle(),
            'list_id' => $list?->getId(),
            'list_title' => $list?->getTitle(),
            'title' => $card->getTitle(),
            'due_date' => $this->formatDateTime($card->getDueDate()),
            'cover_color' => $card->getCoverColor(),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeCardDetail(Card $card): array
    {
        $checklists = $this->getChecklistRepository()->findByCardOrdered($card);
        $comments = $this->getCommentRepository()->findByCardOrdered($card);
        $attachments = $this->getAttachmentRepository()->findByCard($card);

        return [
            ...$this->serializeCardSummary($card),
            'list_id' => $card->getList()?->getId(),
            'board_id' => $card->getBoard()?->getId(),
            'description_md' => $card->getDescriptionMd(),
            'created_by' => $this->serializeUserRef($card->getCreatedBy()),
            'created_at' => $card->getCreatedAt('Y-m-d H:i:s'),
            'updated_at' => $card->getUpdatedAt('Y-m-d H:i:s'),
            'checklists' => array_map(fn (Checklist $cl) => $this->serializeChecklist($cl), $checklists),
            'comments' => array_map(fn (Comment $c) => $this->serializeComment($c), $comments),
            'attachments' => array_map(fn (Attachment $a) => $this->serializeAttachment($a), $attachments),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeChecklist(Checklist $checklist): array
    {
        $items = [];
        foreach ($checklist->getItems() as $item) {
            $items[] = [
                'id' => $item->getId(),
                'text' => $item->getText(),
                'checked' => $item->isChecked(),
                'position' => $item->getPosition(),
            ];
        }

        return [
            'id' => $checklist->getId(),
            'title' => $checklist->getTitle(),
            'position' => $checklist->getPosition(),
            'items' => $items,
        ];
    }

    /** @return array<string, mixed> */
    public function serializeComment(Comment $comment): array
    {
        return [
            'id' => $comment->getId(),
            'text' => $comment->getText(),
            'user' => $this->serializeUserRef($comment->getUser()),
            'created_at' => $comment->getCreatedAt('Y-m-d H:i:s'),
            'updated_at' => $comment->getUpdatedAt('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeAttachment(Attachment $attachment): array
    {
        return [
            'id' => $attachment->getId(),
            'file_name' => $attachment->getFileName(),
            'file_url' => $attachment->getFileUrl(),
            'mime_type' => $attachment->getMimeType(),
            'size_bytes' => $attachment->getSizeBytes(),
            'uploaded_by' => $this->serializeUserRef($attachment->getUploadedBy()),
            'created_at' => $attachment->getCreatedAt('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeActivityLog(ActivityLog $entry): array
    {
        return [
            'id' => $entry->getId(),
            'action' => $entry->getActionType(),
            'details' => $entry->getDetails(),
            'card_id' => $entry->getCard()?->getId(),
            'user' => $this->serializeUserRef($entry->getUser()),
            'created_at' => $entry->getCreatedAt('Y-m-d H:i:s'),
        ];
    }

    /** @return array<string, mixed> */
    public function serializeLabel(Label $label): array
    {
        return [
            'id' => $label->getId(),
            'name' => $label->getName(),
            'color' => $label->getColor(),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function serializeWorkspaceMembers(Workspace $workspace): array
    {
        $members = [[
            'user_id' => $workspace->getOwner()?->getId(),
            'email' => $workspace->getOwner()?->getEmail(),
            'alias' => $workspace->getOwner()?->getAlias(),
            'role' => 'owner',
            'is_owner' => true,
        ]];

        foreach ($workspace->getMembers() as $member) {
            $members[] = [
                'user_id' => $member->getUser()?->getId(),
                'email' => $member->getUser()?->getEmail(),
                'alias' => $member->getUser()?->getAlias(),
                'role' => $member->getRole()->value,
                'is_owner' => false,
            ];
        }

        return $members;
    }

    /** @return list<array<string, mixed>> */
    private function serializeBoardMembers(Board $board): array
    {
        $members = [];
        foreach ($board->getMembers() as $member) {
            $members[] = [
                'user_id' => $member->getUser()?->getId(),
                'email' => $member->getUser()?->getEmail(),
                'alias' => $member->getUser()?->getAlias(),
                'role' => $member->getRole()->value,
            ];
        }

        return $members;
    }

    /** @return array{id: ?int, email: ?string, alias: ?string} */
    private function serializeUserRef(?User $user): array
    {
        return [
            'id' => $user?->getId(),
            'email' => $user?->getEmail(),
            'alias' => $user?->getAlias(),
        ];
    }

    private function resolveWorkspaceRoleLabel(Workspace $workspace, User $viewer): ?string
    {
        if ($this->permissionResolver->isWorkspaceOwner($workspace, $viewer)) {
            return 'owner';
        }

        return $this->permissionResolver->resolveWorkspaceRole($workspace, $viewer)?->value;
    }

    private function normalizeName(mixed $name): string
    {
        $value = trim((string) ($name ?? ''));

        return '' !== $value ? $value : 'Без названия';
    }

    private function normalizeTitle(mixed $title): string
    {
        $value = trim((string) ($title ?? ''));

        return '' !== $value ? $value : 'Без названия';
    }

    private function normalizeNullableText(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }
        $text = trim((string) $value);

        return '' !== $text ? $text : null;
    }

    private function parseFilterDate(?string $value): ?\DateTimeInterface
    {
        if (null === $value || '' === trim($value)) {
            return null;
        }

        try {
            return new \DateTimeImmutable(trim($value));
        } catch (\Exception) {
            throw new BadRequestHttpException('Некорректная дата фильтра');
        }
    }

    private function normalizeBackgroundType(mixed $type): string
    {
        $value = strtolower(trim((string) $type));
        if (!in_array($value, [Board::BACKGROUND_COLOR, Board::BACKGROUND_IMAGE, Board::BACKGROUND_GRADIENT], true)) {
            throw new BadRequestHttpException('background_type: color, image или gradient');
        }

        return $value;
    }

    private function normalizeVisibility(mixed $visibility): string
    {
        $value = strtolower(trim((string) $visibility));
        if (!in_array($value, [Board::VISIBILITY_PRIVATE, Board::VISIBILITY_WORKSPACE], true)) {
            throw new BadRequestHttpException('visibility: private или workspace');
        }

        return $value;
    }

    private function parseMemberRole(string $role): MemberRole
    {
        $parsed = MemberRole::tryFromString($role);
        if (null === $parsed) {
            throw new BadRequestHttpException('role: admin, editor или observer');
        }

        return $parsed;
    }

    private function resolveUserByEmail(string $email): User
    {
        $email = trim($email);
        if ('' === $email) {
            throw new BadRequestHttpException('Укажите email');
        }
        /** @var UserRepository $users */
        $users = $this->getEntityManager()->getRepository(User::class);
        $user = $users->findOneBy(['email' => $email]);
        if (!$user instanceof User) {
            throw new NotFoundHttpException('Пользователь с таким email не найден');
        }

        return $user;
    }

    private function findWorkspaceMember(Workspace $workspace, int $userId): WorkspaceMember
    {
        foreach ($workspace->getMembers() as $member) {
            if ($member->getUser()?->getId() === $userId) {
                return $member;
            }
        }

        throw new NotFoundHttpException('Участник не найден');
    }

    private function findBoardMember(Board $board, int $userId): BoardMember
    {
        foreach ($board->getMembers() as $member) {
            if ($member->getUser()?->getId() === $userId) {
                return $member;
            }
        }

        throw new NotFoundHttpException('Участник доски не найден');
    }

    private function canUpdateListOrder(Board $board, User $user, BoardList $list): bool
    {
        return $this->permissionResolver->hasEditorOrAbove($board, $user)
            || $this->permissionResolver->isListAssignee($list, $user);
    }

    private function nextOrderIndex(Board $board): int
    {
        $max = $this->getBoardListRepository()->getMaxOrderIndex($board);

        return null === $max ? self::POSITION_GAP : $max + self::POSITION_GAP;
    }

    private function nextCardPosition(BoardList $list): int
    {
        $max = $this->getCardRepository()->getMaxPosition($list);

        return null === $max ? self::POSITION_GAP : $max + self::POSITION_GAP;
    }

    private function needsCardRebalance(BoardList $list): bool
    {
        $cards = $this->getCardRepository()->findByListOrdered($list);
        $prev = null;
        foreach ($cards as $card) {
            $position = $card->getPosition();
            if (null !== $prev && $position - $prev < 1) {
                return true;
            }
            $prev = $position;
        }

        return false;
    }

    private function rebalanceCardPositions(BoardList $list): void
    {
        $position = self::POSITION_GAP;
        foreach ($this->getCardRepository()->findByListOrdered($list) as $card) {
            $card->setPosition($position);
            $position += self::POSITION_GAP;
        }
    }

    private function resolveOptionalUserById(mixed $userId): ?User
    {
        if (null === $userId || '' === $userId) {
            return null;
        }
        /** @var UserRepository $users */
        $users = $this->getEntityManager()->getRepository(User::class);
        $user = $users->find((int) $userId);
        if (!$user instanceof User) {
            throw new NotFoundHttpException('Пользователь не найден');
        }

        return $user;
    }

    private function normalizeCardTitle(mixed $title): string
    {
        $value = trim((string) ($title ?? ''));

        return '' !== $value ? $value : 'Без названия';
    }

    private function normalizeLabelName(mixed $name): string
    {
        $value = trim((string) ($name ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите name метки');
        }

        return $value;
    }

    private function normalizeLabelColor(mixed $color): string
    {
        $value = trim((string) ($color ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите color метки');
        }

        return $value;
    }

    private function parseNullableDateTime(mixed $value): ?\DateTimeInterface
    {
        if (null === $value || '' === $value) {
            return null;
        }
        try {
            return new \DateTime((string) $value);
        } catch (\Exception) {
            throw new BadRequestHttpException('Некорректный due_date');
        }
    }

    private function formatDateTime(?\DateTimeInterface $dateTime): ?string
    {
        return $dateTime?->format('Y-m-d\TH:i:s');
    }

    /** @return list<int> */
    private function extractLabelIds(Card $card): array
    {
        $ids = [];
        foreach ($card->getLabels() as $label) {
            if (null !== $label->getId()) {
                $ids[] = $label->getId();
            }
        }

        return $ids;
    }

    /** @return list<int> */
    private function extractAssigneeIds(Card $card): array
    {
        $ids = [];
        foreach ($card->getAssignees() as $assignee) {
            if (null !== $assignee->getId()) {
                $ids[] = $assignee->getId();
            }
        }

        return $ids;
    }

    private function requireCardBoard(Card $card): Board
    {
        $board = $card->getBoard();
        if (!$board instanceof Board) {
            throw new NotFoundHttpException('Доска не найдена');
        }

        return $board;
    }

    private function assertCanManageCard(Board $board, User $user, Card $card): void
    {
        if (!$this->permissionResolver->canManageCards($board, $user, $card->getList(), $card)) {
            throw new AccessDeniedHttpException('Нет прав на изменение карточки');
        }
    }

    private function normalizeChecklistTitle(mixed $title): string
    {
        $value = trim((string) ($title ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите title чеклиста');
        }

        return $value;
    }

    private function normalizeChecklistItemText(mixed $text): string
    {
        $value = trim((string) ($text ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите text пункта');
        }

        return $value;
    }

    private function normalizeCommentText(mixed $text): string
    {
        $value = trim((string) ($text ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите text комментария');
        }

        return $value;
    }

    private function nextChecklistPosition(Card $card): int
    {
        $max = $this->getChecklistRepository()->getMaxPosition($card);

        return null === $max ? self::POSITION_GAP : $max + self::POSITION_GAP;
    }

    private function nextChecklistItemPosition(Checklist $checklist): int
    {
        $max = $this->getChecklistItemRepository()->getMaxPosition($checklist);

        return null === $max ? self::POSITION_GAP : $max + self::POSITION_GAP;
    }

    /** @param list<int> $userIds @return list<User> */
    private function resolveUsersByIds(array $userIds): array
    {
        /** @var UserRepository $users */
        $users = $this->getEntityManager()->getRepository(User::class);
        $resolved = [];
        foreach ($userIds as $userId) {
            $user = $users->find((int) $userId);
            if (!$user instanceof User) {
                throw new NotFoundHttpException('Пользователь не найден');
            }
            $resolved[] = $user;
        }

        return $resolved;
    }

    private function removeAttachmentFile(Attachment $attachment): void
    {
        $fileUrl = $attachment->getFileUrl();
        if ('' === $fileUrl) {
            return;
        }

        $parts = explode('/', $fileUrl, 2);
        if (2 !== count($parts)) {
            return;
        }

        [$subDir, $fileName] = $parts;
        $this->uploadPathResolver->assertAllowedModule('board');
        $this->uploadPathResolver->assertSafeSubDir($subDir);

        $path = $this->uploadDir.'/board/'.$subDir.'/'.$fileName;
        if (is_file($path)) {
            unlink($path);
        }
    }
}
