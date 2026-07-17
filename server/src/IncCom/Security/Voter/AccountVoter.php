<?php

namespace IncCom\Security\Voter;

use IncCom\Entity\Account;
use IncCom\Service\AccountAccessService;
use Main\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class AccountVoter extends Voter
{
    public const VIEW = 'VIEW';
    public const EDIT = 'EDIT';
    public const DELETE = 'DELETE';
    public const MANAGE_USERS = 'MANAGE_USERS';

    public function __construct(
        private readonly AccountAccessService $accountAccessService,
    ) {
    }

    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::VIEW, self::EDIT, self::DELETE, self::MANAGE_USERS], true)
            && $subject instanceof Account;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var Account $account */
        $account = $subject;

        return match ($attribute) {
            self::VIEW => $this->accountAccessService->isParticipant($account, $user),
            self::EDIT, self::DELETE, self::MANAGE_USERS => $this->accountAccessService->isMaster($account, $user),
            default => false,
        };
    }
}
