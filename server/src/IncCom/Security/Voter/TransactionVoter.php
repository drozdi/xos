<?php

namespace IncCom\Security\Voter;

use IncCom\Entity\Transaction;
use IncCom\Service\AccountAccessService;
use Main\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class TransactionVoter extends Voter
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
            && $subject instanceof Transaction;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var Transaction $transaction */
        $transaction = $subject;

        return match ($attribute) {
            self::VIEW => $this->accountAccessService->isParticipant($transaction->getAccount(), $user),
            self::EDIT, self::DELETE => $this->isAuthor($transaction, $user),
            default => false,
        };
    }

    private function isAuthor(Transaction $transaction, User $user): bool
    {
        $author = $transaction->getAuthor();

        return $author !== null && $author->getId() === $user->getId();
    }
}
