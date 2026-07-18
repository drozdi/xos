<?php

namespace Explorer\Service;

use Explorer\Adapter\LocalVolumeAdapter;
use Explorer\Adapter\VolumeAdapterInterface;
use Explorer\Entity\UserDisk;
use Explorer\Model\ExplorerPath;
use Explorer\Model\FilePermissions;
use Explorer\Repository\UserDiskRepository;
use Main\Entity\User;

final class DiskRegistry
{
    /** @var array<string, array<string, mixed>> */
    private array $systemDisks;

    public function __construct(
        private readonly string $uploadDir,
        private readonly string $imgDir,
        private readonly string $homeBaseDir,
        private readonly FileTypeRegistry $fileTypeRegistry,
        private readonly ExplorerPathValidator $pathValidator,
        private readonly UserDiskRepository $userDiskRepository,
    ) {
        $this->systemDisks = [
            'img' => [
                'label' => 'IMG (общий)',
                'source' => 'system',
                'adapter' => 'local',
                'root' => $imgDir,
                'permissions' => FilePermissions::ALL,
                'readOnly' => false,
            ],
            'uploads' => [
                'label' => 'Загрузки приложений',
                'source' => 'system',
                'adapter' => 'local_readonly',
                'root' => $uploadDir,
                'permissions' => FilePermissions::READ | FilePermissions::EXECUTE,
                'readOnly' => true,
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listDisks(User $user): array
    {
        $disks = [];
        foreach ($this->systemDisks as $code => $meta) {
            $disks[] = $this->serializeDisk($code, $meta);
        }

        $homeRoot = rtrim($this->homeBaseDir, '/\\').'/'.$user->getId();
        $disks[] = $this->serializeDisk('home', [
            'label' => 'Личный диск',
            'source' => 'personal',
            'adapter' => 'local',
            'root' => $homeRoot,
            'permissions' => FilePermissions::ALL,
            'readOnly' => false,
        ]);

        foreach ($this->userDiskRepository->findByOwner($user) as $userDisk) {
            $disks[] = $this->serializeUserDisk($userDisk);
        }

        return $disks;
    }

    public function getAdapter(User $user, string $diskCode): VolumeAdapterInterface
    {
        $diskCode = strtolower($diskCode);
        if (isset($this->systemDisks[$diskCode])) {
            return $this->createLocalAdapter($this->systemDisks[$diskCode]);
        }

        if ('home' === $diskCode) {
            $homeRoot = rtrim($this->homeBaseDir, '/\\').'/'.$user->getId();

            return $this->createLocalAdapter([
                'adapter' => 'local',
                'root' => $homeRoot,
                'permissions' => FilePermissions::ALL,
                'readOnly' => false,
            ]);
        }

        foreach ($this->userDiskRepository->findByOwner($user) as $userDisk) {
            if ($userDisk->getCode() === $diskCode) {
                return $this->createAdapterFromUserDisk($userDisk);
            }
        }

        throw new \InvalidArgumentException('Unknown disk');
    }

    public function resolvePath(User $user, ExplorerPath $path): array
    {
        return [
            'adapter' => $this->getAdapter($user, $path->disk),
            'disk' => strtolower($path->disk),
            'relativePath' => $path->relativePath,
            'uri' => $path->toUri(),
        ];
    }

    /**
     * @param array<string, mixed> $meta
     */
    private function createLocalAdapter(array $meta): LocalVolumeAdapter
    {
        return new LocalVolumeAdapter(
            (string) $meta['root'],
            (int) ($meta['permissions'] ?? FilePermissions::READ),
            (bool) ($meta['readOnly'] ?? false),
            $this->fileTypeRegistry,
            $this->pathValidator,
            (string) ($meta['adapter'] ?? 'local'),
        );
    }

    private function createAdapterFromUserDisk(UserDisk $disk): VolumeAdapterInterface
    {
        $config = $disk->getConfig();
        $root = (string) ($config['root'] ?? '');
        if ('' === $root) {
            throw new \RuntimeException('User disk root is not configured');
        }

        return match ($disk->getAdapter()) {
            'local', 'local_readonly' => $this->createLocalAdapter([
                'adapter' => $disk->getAdapter(),
                'root' => $root,
                'permissions' => (int) ($config['permissions'] ?? FilePermissions::ALL),
                'readOnly' => 'local_readonly' === $disk->getAdapter() || (bool) ($config['readOnly'] ?? false),
            ]),
            default => throw new \RuntimeException('Adapter is not implemented yet: '.$disk->getAdapter()),
        };
    }

    /**
     * @param array<string, mixed> $meta
     *
     * @return array<string, mixed>
     */
    private function serializeDisk(string $code, array $meta): array
    {
        return [
            'code' => strtolower($code),
            'label' => (string) ($meta['label'] ?? strtoupper($code)),
            'source' => (string) ($meta['source'] ?? 'system'),
            'adapter' => (string) ($meta['adapter'] ?? 'local'),
            'readOnly' => (bool) ($meta['readOnly'] ?? false),
            'permissions' => FilePermissions::toList((int) ($meta['permissions'] ?? FilePermissions::READ)),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeUserDisk(UserDisk $disk): array
    {
        $config = $disk->getConfig();

        return [
            'id' => $disk->getId(),
            'code' => $disk->getCode(),
            'label' => $disk->getLabel(),
            'source' => 'user',
            'adapter' => $disk->getAdapter(),
            'readOnly' => 'local_readonly' === $disk->getAdapter() || (bool) ($config['readOnly'] ?? false),
            'permissions' => FilePermissions::toList((int) ($config['permissions'] ?? FilePermissions::ALL)),
        ];
    }
}
