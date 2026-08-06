<?php

namespace App\Service;

use App\Entity\UserSetting;
use App\Repository\UserAppDataRepository;
use App\Repository\UserSettingRepository;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;

class DesktopStateService
{
    public const EXPLORER_LAST_PATH_CODE = 'explorer.last_path';

    /** Categories fully owned by desktop-state snapshot (one GET / one PUT). */
    private const MANAGED_CATEGORIES = [
        UserSetting::CATEGORY_USER,
        UserSetting::CATEGORY_APP,
        UserSetting::CATEGORY_WIN,
    ];

    public function __construct(
        private readonly UserSettingRepository $userSettingRepository,
        private readonly UserAppDataRepository $userAppDataRepository,
        private readonly UserSettingValidator $userSettingValidator,
        private readonly UserAppDataValidator $userAppDataValidator,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @return array{settings: list<array{category: string, key: string, value: mixed, updatedAt: string}>, explorerLastPath: array{path: string, updatedAt: string}|null}
     */
    public function load(User $user): array
    {
        return $this->buildSnapshot($user);
    }

    /**
     * @param array<string, mixed> $payload
     *
     * @return array{ok: true, snapshot: array{settings: list<array{category: string, key: string, value: mixed, updatedAt: string}>, explorerLastPath: array{path: string, updatedAt: string}|null}}|array{ok: false, message: string}
     */
    public function save(User $user, array $payload): array
    {
        $error = $this->validatePayload($payload, $user);
        if (null !== $error) {
            return ['ok' => false, 'message' => $error];
        }

        /** @var list<array{category: string, key: string, value: mixed}> $settings */
        $settings = $payload['settings'];
        $explorerLastPath = $payload['explorerLastPath'];

        $this->entityManager->wrapInTransaction(function () use ($user, $settings, $explorerLastPath): void {
            $presentKeys = [];
            foreach ($settings as $item) {
                $this->userSettingRepository->upsert(
                    $user,
                    $item['category'],
                    $item['key'],
                    $item['value']
                );
                $presentKeys[$item['category']."\0".$item['key']] = true;
            }

            // Full replace of USER/APP/WIN for this user (orphan delete)
            foreach (self::MANAGED_CATEGORIES as $category) {
                foreach ($this->userSettingRepository->findByUser($user, $category) as $existing) {
                    $mapKey = $category."\0".$existing->getKey();
                    if (!isset($presentKeys[$mapKey])) {
                        $this->entityManager->remove($existing);
                    }
                }
            }

            if (null === $explorerLastPath) {
                $this->userAppDataRepository->deleteByUserCode($user, self::EXPLORER_LAST_PATH_CODE);
            } else {
                $this->userAppDataRepository->upsert(
                    $user,
                    self::EXPLORER_LAST_PATH_CODE,
                    ['path' => $explorerLastPath['path']]
                );
            }
        });

        return ['ok' => true, 'snapshot' => $this->buildSnapshot($user)];
    }

    public function isManagedSetting(string $category, string $key): bool
    {
        return in_array($category, self::MANAGED_CATEGORIES, true) && '' !== $key;
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function validatePayload(array $payload, User $user): ?string
    {
        if (!array_key_exists('settings', $payload)) {
            return 'Field "settings" is required';
        }

        if (!is_array($payload['settings'])) {
            return 'Field "settings" must be an array';
        }

        if (!array_key_exists('explorerLastPath', $payload)) {
            return 'Field "explorerLastPath" is required';
        }

        $explorerError = $this->validateExplorerLastPath($payload['explorerLastPath'], $user);
        if (null !== $explorerError) {
            return $explorerError;
        }

        $seen = [];
        foreach ($payload['settings'] as $index => $item) {
            if (!is_array($item)) {
                return sprintf('Item at index %d must be an object', $index);
            }

            $itemError = $this->userSettingValidator->validateItem($item);
            if (null !== $itemError) {
                return $itemError;
            }

            /** @var array{category: string, key: string, value: mixed} $item */
            if (!$this->isManagedSetting($item['category'], $item['key'])) {
                return sprintf(
                    'Setting "%s/%s" is not managed by desktop-state',
                    $item['category'],
                    $item['key']
                );
            }

            $mapKey = $item['category']."\0".$item['key'];
            if (isset($seen[$mapKey])) {
                return sprintf(
                    'Duplicate setting "%s/%s" in settings',
                    $item['category'],
                    $item['key']
                );
            }
            $seen[$mapKey] = true;
        }

        return null;
    }

    private function validateExplorerLastPath(mixed $explorerLastPath, User $user): ?string
    {
        if (null === $explorerLastPath) {
            return null;
        }

        if (!is_array($explorerLastPath)) {
            return 'Field "explorerLastPath" must be an object or null';
        }

        if (!isset($explorerLastPath['path']) || !is_string($explorerLastPath['path'])) {
            return 'Field "explorerLastPath.path" is required and must be a string';
        }

        $value = ['path' => $explorerLastPath['path']];

        return $this->userAppDataValidator->validateItem([
            'code' => self::EXPLORER_LAST_PATH_CODE,
            'value' => $value,
        ], $user);
    }

    /**
     * @return array{settings: list<array{category: string, key: string, value: mixed, updatedAt: string}>, explorerLastPath: array{path: string, updatedAt: string}|null}
     */
    private function buildSnapshot(User $user): array
    {
        $settings = [];

        foreach (self::MANAGED_CATEGORIES as $category) {
            foreach ($this->userSettingRepository->findByUser($user, $category) as $setting) {
                $settings[] = $this->serializeSetting($setting);
            }
        }

        $explorerRow = $this->userAppDataRepository->findOneByUserCode($user, self::EXPLORER_LAST_PATH_CODE);
        $explorerLastPath = null;
        if (null !== $explorerRow) {
            $value = $explorerRow->getValue();
            $path = is_array($value) && isset($value['path']) && is_string($value['path'])
                ? $value['path']
                : '';
            $explorerLastPath = [
                'path' => $path,
                'updatedAt' => $explorerRow->getUpdatedAt()->format(\DateTimeInterface::ATOM),
            ];
        }

        return [
            'settings' => $settings,
            'explorerLastPath' => $explorerLastPath,
        ];
    }

    /**
     * @return array{category: string, key: string, value: mixed, updatedAt: string}
     */
    private function serializeSetting(UserSetting $setting): array
    {
        return [
            'category' => $setting->getCategory(),
            'key' => $setting->getKey(),
            'value' => $setting->getValue(),
            'updatedAt' => $setting->getUpdatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
