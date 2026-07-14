<?php

namespace App\Security;

use Main\Entity\User;
use Main\Service\ClaimantManager;

final class UserScopeResolver
{
    public function __construct(
        private readonly ClaimantManager $claimantManager,
    ) {
    }

    /**
     * @return array<string, int>
     */
    public function resolve(User $user): array
    {
        $scopes = [];

        foreach ($user->getAccesses() as $access) {
            $code = $access->getCode();
            if (null !== $code) {
                $scopes[$code] = $access->getLevel();
            }
        }

        foreach ($user->getRoles() as $role) {
            foreach ($this->claimantManager->getAccessesRole($role) as $code => $level) {
                $scopes[$code] = ($scopes[$code] ?? 0) | $level;
            }
        }

        return $scopes;
    }

    /**
     * @return array<string, mixed>
     */
    public function serializeUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'login' => $user->getLogin(),
            'email' => $user->getEmail(),
            'alias' => $user->getAlias(),
            'roles' => $user->getRoles(),
            'scopes' => $this->resolve($user),
        ];
    }
}
