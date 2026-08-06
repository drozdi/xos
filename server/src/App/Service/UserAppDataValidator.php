<?php

namespace App\Service;

use App\Repository\UserAppDataRepository;
use Main\Entity\User;

class UserAppDataValidator
{
    public const MAX_CODE_LENGTH = 191;
    public const MAX_VALUE_BYTES = 65536;
    public const MAX_KEYS_PER_USER = 500;
    public const CODE_PATTERN = '/^[a-z0-9._-]+$/';

    public function __construct(
        private readonly UserAppDataRepository $userAppDataRepository,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     */
    public function validateItem(array $data, User $user): ?string
    {
        if (!isset($data['code']) || !is_string($data['code'])) {
            return 'Field "code" is required and must be a string';
        }

        $codeError = $this->validateCode($data['code']);
        if (null !== $codeError) {
            return $codeError;
        }

        if (!array_key_exists('value', $data)) {
            return 'Field "value" is required';
        }

        $valueError = $this->validateValue($data['value']);
        if (null !== $valueError) {
            return $valueError;
        }

        $existing = $this->userAppDataRepository->findOneByUserCode($user, $data['code']);
        if (null === $existing) {
            $quotaError = $this->validateQuota($this->userAppDataRepository->countByUser($user), true);
            if (null !== $quotaError) {
                return $quotaError;
            }
        }

        return null;
    }

    public function validateCode(string $code): ?string
    {
        if ('' === $code) {
            return 'Field "code" must not be empty';
        }

        if (strlen($code) > self::MAX_CODE_LENGTH) {
            return sprintf('Field "code" must not exceed %d characters', self::MAX_CODE_LENGTH);
        }

        if (1 !== preg_match(self::CODE_PATTERN, $code)) {
            return 'Field "code" must match ^[a-z0-9._-]+$';
        }

        return null;
    }

    public function validateValue(mixed $value): ?string
    {
        if (!$this->isJsonSerializable($value)) {
            return 'Field "value" must be JSON-serializable';
        }

        $encoded = json_encode($value, JSON_THROW_ON_ERROR);
        if (strlen($encoded) > self::MAX_VALUE_BYTES) {
            return sprintf('Field "value" must not exceed %d bytes when JSON-encoded', self::MAX_VALUE_BYTES);
        }

        return null;
    }

    public function validateQuota(int $currentCount, bool $isNew): ?string
    {
        if ($isNew && $currentCount >= self::MAX_KEYS_PER_USER) {
            return sprintf('Maximum of %d keys per user exceeded', self::MAX_KEYS_PER_USER);
        }

        return null;
    }

    private function isJsonSerializable(mixed $value): bool
    {
        if (null === $value) {
            return true;
        }

        if (is_resource($value)) {
            return false;
        }

        json_encode($value);

        return JSON_ERROR_NONE === json_last_error();
    }
}
