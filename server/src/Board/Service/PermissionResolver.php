<?php

namespace Board\Service;

use Board\Entity\Board;
use Board\Entity\BoardList;
use Board\Entity\Card;
use Board\Entity\Workspace;
use Board\Enum\MemberRole;
use Main\Entity\User;

class PermissionResolver
{
    public function isWorkspaceOwner(Workspace $workspace, User $user): bool
    {
        return $workspace->getOwner()?->getId() === $user->getId();
    }

    public function resolveWorkspaceRole(Workspace $workspace, User $user): ?MemberRole
    {
        if ($this->isWorkspaceOwner($workspace, $user)) {
            return null;
        }

        foreach ($workspace->getMembers() as $member) {
            if ($member->getUser()?->getId() === $user->getId()) {
                return $member->getRole();
            }
        }

        return null;
    }

    public function resolveBoardRole(Board $board, User $user): ?MemberRole
    {
        foreach ($board->getMembers() as $member) {
            if ($member->getUser()?->getId() === $user->getId()) {
                return $member->getRole();
            }
        }

        return null;
    }

    /**
     * Effective board role: owner > max(workspace_member, board_member).
     *
     * @return 'owner'|'admin'|'editor'|'observer'|null
     */
    public function resolveEffectiveBoardRole(Board $board, User $user): ?string
    {
        $workspace = $board->getWorkspace();
        if (null === $workspace) {
            return null;
        }

        if ($this->isWorkspaceOwner($workspace, $user)) {
            return 'owner';
        }

        $wsRole = $this->resolveWorkspaceRole($workspace, $user);
        $boardRole = $this->resolveBoardRole($board, $user);

        return $this->maxRoleValue($wsRole, $boardRole);
    }

    public function canViewWorkspace(Workspace $workspace, User $user): bool
    {
        return $this->isWorkspaceOwner($workspace, $user)
            || null !== $this->resolveWorkspaceRole($workspace, $user);
    }

    public function canEditWorkspace(Workspace $workspace, User $user): bool
    {
        if ($this->isWorkspaceOwner($workspace, $user)) {
            return true;
        }

        $role = $this->resolveWorkspaceRole($workspace, $user);

        return MemberRole::Admin === $role;
    }

    public function canManageWorkspaceMembers(Workspace $workspace, User $user): bool
    {
        return $this->canEditWorkspace($workspace, $user);
    }

    public function canCreateBoard(Workspace $workspace, User $user): bool
    {
        if ($this->isWorkspaceOwner($workspace, $user)) {
            return true;
        }

        $role = $this->resolveWorkspaceRole($workspace, $user);

        return MemberRole::Admin === $role || MemberRole::Editor === $role;
    }

    public function canViewBoard(Board $board, User $user): bool
    {
        $workspace = $board->getWorkspace();
        if (null === $workspace) {
            return false;
        }

        if ($this->isWorkspaceOwner($workspace, $user)) {
            return true;
        }

        if (null !== $this->resolveBoardRole($board, $user)) {
            return true;
        }

        $wsRole = $this->resolveWorkspaceRole($workspace, $user);
        if (null === $wsRole) {
            return false;
        }

        if (MemberRole::Admin === $wsRole) {
            return true;
        }

        if (Board::VISIBILITY_WORKSPACE === $board->getVisibility()) {
            return $wsRole->level() >= MemberRole::Editor->level();
        }

        return false;
    }

    public function canEditBoard(Board $board, User $user): bool
    {
        $role = $this->resolveEffectiveBoardRole($board, $user);

        return 'owner' === $role || 'admin' === $role;
    }

    public function canManageBoardMembers(Board $board, User $user): bool
    {
        return $this->canEditBoard($board, $user);
    }

    public function isListAssignee(BoardList $list, User $user): bool
    {
        return $list->getAssignee()?->getId() === $user->getId();
    }

    public function hasEditorOrAbove(Board $board, User $user): bool
    {
        $role = $this->resolveEffectiveBoardRole($board, $user);

        return in_array($role, ['owner', 'admin', 'editor'], true);
    }

    public function canManageLists(Board $board, User $user): bool
    {
        return $this->hasEditorOrAbove($board, $user);
    }

    public function canManageLabels(Board $board, User $user): bool
    {
        return $this->hasEditorOrAbove($board, $user);
    }

    public function canAddComment(Board $board, User $user): bool
    {
        return $this->hasEditorOrAbove($board, $user);
    }

    public function canEditComment(Board $board, User $user, User $author): bool
    {
        if ($author->getId() === $user->getId()) {
            return true;
        }

        return $this->canEditBoard($board, $user);
    }

    public function canDeleteComment(Board $board, User $user, User $author): bool
    {
        if ($author->getId() === $user->getId()) {
            return true;
        }

        return $this->canEditBoard($board, $user);
    }

    public function canManageCards(Board $board, User $user, ?BoardList $list = null, ?Card $card = null): bool
    {
        if ($this->hasEditorOrAbove($board, $user)) {
            return true;
        }

        if (null !== $list && $this->isListAssignee($list, $user)) {
            return true;
        }

        if (null !== $card) {
            $cardList = $card->getList();
            if (null !== $cardList && $this->isListAssignee($cardList, $user)) {
                return true;
            }

            foreach ($card->getAssignees() as $assignee) {
                if ($assignee->getId() === $user->getId()) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return 'admin'|'editor'|'observer'|null
     */
    private function maxRoleValue(?MemberRole $a, ?MemberRole $b): ?string
    {
        $best = null;
        foreach ([$a, $b] as $role) {
            if (null === $role) {
                continue;
            }
            if (null === $best || $role->level() > $best->level()) {
                $best = $role;
            }
        }

        return $best?->value;
    }
}
