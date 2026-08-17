<?php

namespace App\Tests\Board;

use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\BoardMember;
use Board\Entity\Card;
use Board\Entity\Workspace;
use Board\Entity\WorkspaceMember;
use Board\Enum\MemberRole;
use Board\Service\PermissionResolver;
use Main\Entity\User;
use PHPUnit\Framework\TestCase;

class PermissionResolverTest extends TestCase
{
    private PermissionResolver $resolver;

    protected function setUp(): void
    {
        $this->resolver = new PermissionResolver();
    }

    /**
     * @dataProvider workspaceViewProvider
     */
    public function testWorkspaceViewMatrix(string $actor, bool $expected): void
    {
        [$workspace, $users] = $this->createWorkspaceFixture();
        $user = $users[$actor];

        self::assertSame($expected, $this->resolver->canViewWorkspace($workspace, $user));
    }

    /**
     * @return array<string, array{0: string, 1: bool}>
     */
    public static function workspaceViewProvider(): array
    {
        return [
            'owner' => ['owner', true],
            'admin' => ['admin', true],
            'editor' => ['editor', true],
            'observer' => ['observer', true],
            'outsider' => ['outsider', false],
        ];
    }

    /**
     * @dataProvider workspaceEditProvider
     */
    public function testWorkspaceEditMatrix(string $actor, bool $expected): void
    {
        [$workspace, $users] = $this->createWorkspaceFixture();
        $user = $users[$actor];

        self::assertSame($expected, $this->resolver->canEditWorkspace($workspace, $user));
    }

    /**
     * @return array<string, array{0: string, 1: bool}>
     */
    public static function workspaceEditProvider(): array
    {
        return [
            'owner' => ['owner', true],
            'admin' => ['admin', true],
            'editor' => ['editor', false],
            'observer' => ['observer', false],
        ];
    }

    /**
     * @dataProvider workspaceManageMembersProvider
     */
    public function testWorkspaceManageMembersMatrix(string $actor, bool $expected): void
    {
        [$workspace, $users] = $this->createWorkspaceFixture();
        $user = $users[$actor];

        self::assertSame($expected, $this->resolver->canManageWorkspaceMembers($workspace, $user));
    }

    /**
     * @return array<string, array{0: string, 1: bool}>
     */
    public static function workspaceManageMembersProvider(): array
    {
        return [
            'owner' => ['owner', true],
            'admin' => ['admin', true],
            'editor' => ['editor', false],
            'observer' => ['observer', false],
        ];
    }

    /**
     * @dataProvider workspaceCreateBoardProvider
     */
    public function testWorkspaceCreateBoardMatrix(string $actor, bool $expected): void
    {
        [$workspace, $users] = $this->createWorkspaceFixture();
        $user = $users[$actor];

        self::assertSame($expected, $this->resolver->canCreateBoard($workspace, $user));
    }

    /**
     * @return array<string, array{0: string, 1: bool}>
     */
    public static function workspaceCreateBoardProvider(): array
    {
        return [
            'owner' => ['owner', true],
            'admin' => ['admin', true],
            'editor' => ['editor', true],
            'observer' => ['observer', false],
        ];
    }

    /**
     * @dataProvider boardViewProvider
     */
    public function testBoardViewMatrix(string $visibility, string $actor, bool $expected): void
    {
        [$workspace, $users, $board] = $this->createBoardFixture($visibility);
        $user = $users[$actor];

        self::assertSame($expected, $this->resolver->canViewBoard($board, $user));
    }

    /**
     * @return array<string, array{0: string, 1: string, 2: bool}>
     */
    public static function boardViewProvider(): array
    {
        return [
            'owner private' => [Board::VISIBILITY_PRIVATE, 'owner', true],
            'admin private' => [Board::VISIBILITY_PRIVATE, 'admin', true],
            'editor private' => [Board::VISIBILITY_PRIVATE, 'editor', false],
            'observer private' => [Board::VISIBILITY_PRIVATE, 'observer', false],
            'editor workspace visible' => [Board::VISIBILITY_WORKSPACE, 'editor', true],
            'observer workspace hidden' => [Board::VISIBILITY_WORKSPACE, 'observer', false],
            'board member observer private' => [Board::VISIBILITY_PRIVATE, 'board_observer', true],
        ];
    }

    /**
     * @dataProvider boardEditProvider
     */
    public function testBoardEditMatrix(string $actor, bool $expected): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_PRIVATE);
        $user = $users[$actor];

        self::assertSame($expected, $this->resolver->canEditBoard($board, $user));
    }

    /**
     * @return array<string, array{0: string, 1: bool}>
     */
    public static function boardEditProvider(): array
    {
        return [
            'owner' => ['owner', true],
            'admin' => ['admin', true],
            'editor' => ['editor', false],
            'observer' => ['observer', false],
            'board admin member' => ['board_admin', true],
        ];
    }

    /**
     * @dataProvider boardManageMembersProvider
     */
    public function testBoardManageMembersMatrix(string $actor, bool $expected): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_PRIVATE);
        $user = $users[$actor];

        self::assertSame($expected, $this->resolver->canManageBoardMembers($board, $user));
    }

    /**
     * @return array<string, array{0: string, 1: bool}>
     */
    public static function boardManageMembersProvider(): array
    {
        return [
            'owner' => ['owner', true],
            'admin' => ['admin', true],
            'editor' => ['editor', false],
            'board admin member' => ['board_admin', true],
        ];
    }

    public function testResolveEffectiveBoardRoleUsesMaxOfWorkspaceAndBoard(): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_PRIVATE);
        $editor = $users['editor'];

        $boardMember = new BoardMember();
        $boardMember->setUser($editor);
        $boardMember->setRole(MemberRole::Admin);
        $board->addMember($boardMember);

        self::assertSame('admin', $this->resolver->resolveEffectiveBoardRole($board, $editor));
    }

    public function testListAssigneeObserverCanManageCardsInAssignedList(): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_WORKSPACE);
        $observer = $users['observer'];

        $list = new BoardList();
        $list->setBoard($board);
        $list->setTitle('Assigned');
        $list->setOrderIndex(1024);
        $list->setAssignee($observer);
        $board->addList($list);

        self::assertFalse($this->resolver->canManageLists($board, $observer));
        self::assertTrue($this->resolver->canManageCards($board, $observer, $list));
    }

    public function testListAssigneeObserverCannotManageCardsInOtherList(): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_WORKSPACE);
        $observer = $users['observer'];
        $editor = $users['editor'];

        $assignedList = new BoardList();
        $assignedList->setBoard($board);
        $assignedList->setTitle('Assigned');
        $assignedList->setOrderIndex(1024);
        $assignedList->setAssignee($observer);

        $otherList = new BoardList();
        $otherList->setBoard($board);
        $otherList->setTitle('Other');
        $otherList->setOrderIndex(2048);
        $otherList->setAssignee($editor);

        self::assertFalse($this->resolver->canManageCards($board, $observer, $otherList));
    }

    public function testCardAssigneeCanManageOwnCardWhenObserver(): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_WORKSPACE);
        $observer = $users['observer'];

        $list = new BoardList();
        $list->setBoard($board);
        $list->setTitle('List');
        $list->setOrderIndex(1024);

        $card = new Card();
        $card->setList($list);
        $card->setTitle('Task');
        $card->addAssignee($observer);

        self::assertTrue($this->resolver->canManageCards($board, $observer, null, $card));
    }

    public function testEditorCanManageListsLabelsAndCards(): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_WORKSPACE);
        $editor = $users['editor'];

        self::assertTrue($this->resolver->canManageLists($board, $editor));
        self::assertTrue($this->resolver->canManageLabels($board, $editor));
        self::assertTrue($this->resolver->canManageCards($board, $editor));
    }

    public function testObserverCannotManageListsOrLabels(): void
    {
        [, $users, $board] = $this->createBoardFixture(Board::VISIBILITY_WORKSPACE);
        $observer = $users['observer'];

        self::assertFalse($this->resolver->canManageLists($board, $observer));
        self::assertFalse($this->resolver->canManageLabels($board, $observer));
        self::assertFalse($this->resolver->canManageCards($board, $observer));
    }

    /**
     * @return array{0: Workspace, 1: array<string, User>}
     */
    private function createWorkspaceFixture(): array
    {
        $owner = $this->user(1);
        $admin = $this->user(2);
        $editor = $this->user(3);
        $observer = $this->user(4);
        $outsider = $this->user(5);

        $workspace = new Workspace();
        $workspace->setOwner($owner);
        $workspace->setName('Test');

        $workspace->addMember($this->member($admin, MemberRole::Admin));
        $workspace->addMember($this->member($editor, MemberRole::Editor));
        $workspace->addMember($this->member($observer, MemberRole::Observer));

        return [$workspace, [
            'owner' => $owner,
            'admin' => $admin,
            'editor' => $editor,
            'observer' => $observer,
            'outsider' => $outsider,
        ]];
    }

    /**
     * @return array{0: Workspace, 1: array<string, User>, 2: Board}
     */
    private function createBoardFixture(string $visibility): array
    {
        [$workspace, $users] = $this->createWorkspaceFixture();

        $boardAdmin = $this->user(6);
        $boardObserver = $this->user(7);
        $users['board_admin'] = $boardAdmin;
        $users['board_observer'] = $boardObserver;

        $board = new Board();
        $board->setWorkspace($workspace);
        $board->setTitle('Sprint');
        $board->setVisibility($visibility);

        $board->addMember($this->boardMember($boardAdmin, MemberRole::Admin));
        $board->addMember($this->boardMember($boardObserver, MemberRole::Observer));

        return [$workspace, $users, $board];
    }

    private function user(int $id): User
    {
        $user = new User();
        $user->setLogin('user'.$id);
        $user->setEmail('user'.$id.'@example.com');
        $user->setAlias('User '.$id);
        $reflection = new \ReflectionProperty(User::class, 'id');
        $reflection->setAccessible(true);
        $reflection->setValue($user, $id);

        return $user;
    }

    private function member(User $user, MemberRole $role): WorkspaceMember
    {
        $member = new WorkspaceMember();
        $member->setUser($user);
        $member->setRole($role);

        return $member;
    }

    private function boardMember(User $user, MemberRole $role): BoardMember
    {
        $member = new BoardMember();
        $member->setUser($user);
        $member->setRole($role);

        return $member;
    }
}
