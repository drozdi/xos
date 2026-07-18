<?php

namespace Explorer\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use Explorer\Entity\UserDisk;
use Explorer\Model\FilePermissions;
use Explorer\Repository\UserDiskRepository;
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
        $root = trim((string) ($data['root'] ?? ''));
        if ('' === $code || '' === $label || '' === $root) {
            return ApiResponse::badRequest('code, label and root are required');
        }

        $disk = (new UserDisk())
            ->setOwner($user)
            ->setCode($code)
            ->setLabel($label)
            ->setAdapter($adapter)
            ->setConfig([
                'root' => $root,
                'permissions' => FilePermissions::ALL,
                'readOnly' => 'local_readonly' === $adapter,
            ]);
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
     * @return array<string, mixed>
     */
    private function serializeDisk(UserDisk $disk): array
    {
        return [
            'id' => $disk->getId(),
            'code' => $disk->getCode(),
            'label' => $disk->getLabel(),
            'adapter' => $disk->getAdapter(),
            'config' => $disk->getConfig(),
            'sort' => $disk->getSort(),
        ];
    }
}
