<?php

namespace IncCom\Security\Voter;

use IncCom\Entity\Account;
use IncCom\Entity\Category;
use IncCom\Service\AccountAccessService;
use Main\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class TransactionCategoryVoter extends Voter
{
    public const VIEW = 'VIEW';
    public const EDIT = 'EDIT';
    public const DELETE = 'DELETE';

    public function __construct(
        private readonly AccountAccessService $accountAccessService,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)
            && $subject instanceof Category;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var Category $category */
        $category = $subject;
        $account = $category->getAccount();
        if ($account === null) {
            return false;
        }

        return match ($attribute) {
            self::VIEW => $this->accountAccessService->isParticipant($account, $user),
            self::EDIT, self::DELETE => $this->isAuthorOrMaster($category, $account, $user),
            default => false,
        };
    }

    private function isAuthorOrMaster(Category $category, Account $account, User $user): bool
    {
        if ($this->accountAccessService->isMaster($account, $user)) {
            return true;
        }

        $createdBy = $category->getCreatedBy();

        return $createdBy !== null && $createdBy->getId() === $user->getId();
    }
}
