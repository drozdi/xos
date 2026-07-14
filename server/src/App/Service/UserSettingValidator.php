<?php

namespace App\Service;

use App\Entity\UserSetting;

class UserSettingValidator
{
    public const MAX_KEY_LENGTH = 512;

    /**
     * @param array<string, mixed> $data
     */
    public function validateItem(array $data): ?string
    {
        if (!isset($data['category']) || !is_string($data['category'])) {
            return 'Field "category" is required and must be a string';
        }

        if (!in_array($data['category'], UserSetting::CATEGORIES, true)) {
            return sprintf(
                'Invalid category "%s". Allowed: %s',
                $data['category'],
                implode(', ', UserSetting::CATEGORIES)
            );
        }

        if (!isset($data['key']) || !is_string($data['key'])) {
            return 'Field "key" is required and must be a string';
        }

        if ('' === trim($data['key'])) {
            return 'Field "key" must not be empty';
        }

        if (strlen($data['key']) > self::MAX_KEY_LENGTH) {
            return sprintf('Field "key" must not exceed %d characters', self::MAX_KEY_LENGTH);
        }

        if (!array_key_exists('value', $data)) {
            return 'Field "value" is required';
        }

        if (!$this->isJsonSerializable($data['value'])) {
            return 'Field "value" must be JSON-serializable';
        }

        return null;
    }

    public function validateCategory(string $category): ?string
    {
        if (!in_array($category, UserSetting::CATEGORIES, true)) {
            return sprintf(
                'Invalid category "%s". Allowed: %s',
                $category,
                implode(', ', UserSetting::CATEGORIES)
            );
        }

        return null;
    }

    private function isJsonSerializable(mixed $value): bool
    {
        if (null === $value) {
            return true;
        }

        json_encode($value);

        return JSON_ERROR_NONE === json_last_error();
    }
}
