<?php

namespace IncCom\Security\Voter;

use IncCom\Entity\Product;
use IncCom\Entity\Tag;
use Main\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

class ItemVoter extends Voter
{
    public const MANAGE = 'MANAGE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return $attribute === self::MANAGE
            && ($subject instanceof Product || $subject instanceof Tag);
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();
        if (!$user instanceof User) {
            return false;
        }

        $owner = match (true) {
            $subject instanceof Product => $subject->getUser(),
            $subject instanceof Tag => $subject->getUser(),
            default => null,
        };

        return $owner !== null && $owner->getId() === $user->getId();
    }
}
