<?php

namespace Main\Service;

use App\Repository\UserAppDataRepository;
use Main\Entity\User;

/**
 * Multi-OU tenancy slice: active OU from user_app_data.
 * ROLE_ROOT — no forced filter; others — list/create scoped to active_ou_id.
 */
final class OuScope
{
    public const ACTIVE_OU_CODE = 'main.active_ou_id';

    public function __construct(
        private readonly UserAppDataRepository $userAppDataRepository,
    ) {
    }

    public function isRoot(User $user): bool
    {
        return $user->hasRole('ROLE_ROOT');
    }

    public function getActiveOuId(User $user): ?int
    {
        $row = $this->userAppDataRepository->findOneByUserCode($user, self::ACTIVE_OU_CODE);
        if (null === $row) {
            return null;
        }

        $value = $row->getValue();
        if (is_int($value) || (is_string($value) && is_numeric($value))) {
            $id = (int) $value;

            return $id > 0 ? $id : null;
        }
        if (is_array($value)) {
            $raw = $value['ouId'] ?? $value['ou_id'] ?? $value['id'] ?? null;
            if (is_int($raw) || (is_string($raw) && is_numeric($raw))) {
                $id = (int) $raw;

                return $id > 0 ? $id : null;
            }
        }

        return null;
    }

    /**
     * Force `ou` / `ou_id` list filters for non-ROOT when active OU is set.
     *
     * @param array<string, mixed> $filters
     *
     * @return array<string, mixed>
     */
    public function applyListFilter(User $user, array $filters): array
    {
        if ($this->isRoot($user)) {
            return $filters;
        }

        $ouId = $this->getActiveOuId($user);
        if (null === $ouId) {
            return $filters;
        }

        $filters['ou'] = $ouId;
        $filters['ou_id'] = $ouId;

        return $filters;
    }

    /**
     * Default create payload OU for non-ROOT (ROOT may pass explicit ou_id).
     *
     * @param array<string, mixed> $payload
     *
     * @return array<string, mixed>
     */
    public function applyCreateDefaults(User $user, array $payload): array
    {
        if ($this->isRoot($user)) {
            return $payload;
        }

        $ouId = $this->getActiveOuId($user);
        if (null === $ouId) {
            return $payload;
        }

        $payload['ou_id'] = $ouId;

        return $payload;
    }
}
