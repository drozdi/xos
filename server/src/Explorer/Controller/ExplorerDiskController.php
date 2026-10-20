<?php

namespace Explorer\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use Explorer\Entity\UserDisk;
use Explorer\Model\FilePermissions;
use Explorer\Repository\UserDiskRepository;
use Explorer\Service\YandexDiskTokenCipher;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/explorer/disks')]
#[Access('explorer')]
class ExplorerDiskController extends AbstractController
{
    private const RESERVED_CODES = ['home', 'img', 'uploads'];

    public function __construct(
        private readonly YandexDiskTokenCipher $yandexDiskTokenCipher,
    ) {
    }

    #[Route('', methods: ['GET'])]
    #[Access('can_read')]
    public function list(UserDiskRepository $repository, #[CurrentUser] User $user): JsonResponse
    {
        $items = array_map(
            fn (UserDisk $disk) => $this->serializeDisk($disk),
            $repository->findByOwner($user),
        );

        return $this->json($items);
    }

    #[Route('', methods: ['POST'])]
    #[Access('can_write')]
    public function create(Request $request, UserDiskRepository $repository, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $code = strtolower(trim((string) ($data['code'] ?? '')));
        $label = trim((string) ($data['label'] ?? ''));
        $adapter = (string) ($data['adapter'] ?? 'local');

        if ('' === $code || '' === $label) {
            return ApiResponse::badRequest('code and label are required');
        }
        if (in_array($code, self::RESERVED_CODES, true)) {
            return ApiResponse::badRequest('Disk code is reserved');
        }
        if (!preg_match('/^[a-z0-9_-]+$/', $code)) {
            return ApiResponse::badRequest('Disk code must be latin letters, digits, _ or -');
        }

        try {
            $config = match ($adapter) {
                'local', 'local_readonly' => $this->buildLocalConfig($data, $adapter),
                'yandex_disk' => $this->buildYandexConfig($data),
                default => throw new \InvalidArgumentException('Unknown adapter: '.$adapter),
            };
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::badRequest($e->getMessage());
        }

        $existing = $repository->findByOwner($user);
        foreach ($existing as $disk) {
            if ($disk->getCode() === $code) {
                return ApiResponse::badRequest('Disk code already exists');
            }
        }

        $disk = (new UserDisk())
            ->setOwner($user)
            ->setCode($code)
            ->setLabel($label)
            ->setAdapter($adapter)
            ->setConfig($config);
        $repository->save($disk, true);

        return $this->json($this->serializeDisk($disk), 201);
    }

    #[Route('/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    #[Access('can_delete')]
    public function delete(int $id, UserDiskRepository $repository, #[CurrentUser] User $user): JsonResponse
    {
        $disk = $repository->find($id);
        if (null === $disk || $disk->getOwner()?->getId() !== $user->getId()) {
            return ApiResponse::notFound('Disk not found');
        }

        $repository->remove($disk, true);

        return new JsonResponse(null, 204);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    private function buildLocalConfig(array $data, string $adapter): array
    {
        $root = trim((string) ($data['root'] ?? ''));
        if ('' === $root) {
            throw new \InvalidArgumentException('root is required for local disks');
        }

        return [
            'root' => $root,
            'permissions' => FilePermissions::ALL,
            'readOnly' => 'local_readonly' === $adapter,
        ];
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    private function buildYandexConfig(array $data): array
    {
        $token = trim((string) ($data['oauthToken'] ?? ''));
        if ('' === $token) {
            throw new \InvalidArgumentException('oauthToken is required for Yandex Disk');
        }

        $rootPath = trim((string) ($data['rootPath'] ?? 'disk:/'));
        if ('' === $rootPath) {
            $rootPath = 'disk:/';
        }

        return [
            'accessToken' => $this->yandexDiskTokenCipher->encrypt($token),
            'rootPath' => $rootPath,
            'tokenHint' => strlen($token) <= 4 ? $token : substr($token, -4),
            'permissions' => FilePermissions::ALL,
            'readOnly' => false,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeDisk(UserDisk $disk): array
    {
        $config = $disk->getConfig();
        $safeConfig = match ($disk->getAdapter()) {
            'yandex_disk' => [
                'rootPath' => (string) ($config['rootPath'] ?? 'disk:/'),
                'tokenHint' => (string) ($config['tokenHint'] ?? ''),
                'readOnly' => (bool) ($config['readOnly'] ?? false),
            ],
            default => [
                'root' => (string) ($config['root'] ?? ''),
                'readOnly' => (bool) ($config['readOnly'] ?? false),
            ],
        };

        return [
            'id' => $disk->getId(),
            'code' => $disk->getCode(),
            'label' => $disk->getLabel(),
            'adapter' => $disk->getAdapter(),
            'config' => $safeConfig,
            'sort' => $disk->getSort(),
        ];
    }
}
