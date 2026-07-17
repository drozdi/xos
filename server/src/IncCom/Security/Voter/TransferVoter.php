<?php

namespace IncCom\Security\Voter;

use IncCom\Entity\Transfer;
use IncCom\Service\AccountAccessService;
use Main\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class TransferVoter extends Voter
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
            && $subject instanceof Transfer;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        /** @var Transfer $transfer */
        $transfer = $subject;

        return match ($attribute) {
            self::VIEW => $this->canView($transfer, $user),
            self::EDIT, self::DELETE => $this->isAuthor($transfer, $user),
            default => false,
        };
    }

    private function canView(Transfer $transfer, User $user): bool
    {
        return $this->accountAccessService->isParticipant($transfer->getFromAccount(), $user)
            || $this->accountAccessService->isParticipant($transfer->getToAccount(), $user);
    }

    private function isAuthor(Transfer $transfer, User $user): bool
    {
        $author = $transfer->getAuthor();

        return $author !== null && $author->getId() === $user->getId();
    }
}
