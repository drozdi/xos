<?php

namespace Explorer\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use Explorer\Entity\UserDisk;
use Explorer\Model\FilePermissions;
use Explorer\Repository\UserDiskRepository;
use Explorer\Service\ExplorerManager;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/explorer')]
#[Access('explorer')]
class ExplorerOperationController extends AbstractController
{
    #[Route('/folder', methods: ['POST'])]
    #[Access('can_write')]
    public function createFolder(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $path = (string) ($data['path'] ?? '');
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            return $this->json($manager->mkdir($user, $path), 201);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/rename', methods: ['PATCH'])]
    #[Access('can_write')]
    public function rename(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $path = (string) ($data['path'] ?? '');
        $newName = trim((string) ($data['newName'] ?? ''));
        if ('' === $path || '' === $newName) {
            return ApiResponse::badRequest('path and newName are required');
        }

        try {
            return $this->json($manager->rename($user, $path, $newName));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/copy', methods: ['POST'])]
    #[Access('can_write')]
    public function copy(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $from = (string) ($data['from'] ?? '');
        $to = (string) ($data['to'] ?? '');
        $overwrite = (bool) ($data['overwrite'] ?? false);
        if ('' === $from || '' === $to) {
            return ApiResponse::badRequest('from and to are required');
        }

        try {
            return $this->json($manager->copy($user, $from, $to, $overwrite));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/move', methods: ['POST'])]
    #[Access('can_write')]
    public function move(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $from = (string) ($data['from'] ?? '');
        $to = (string) ($data['to'] ?? '');
        $overwrite = (bool) ($data['overwrite'] ?? false);
        if ('' === $from || '' === $to) {
            return ApiResponse::badRequest('from and to are required');
        }

        try {
            return $this->json($manager->move($user, $from, $to, $overwrite));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/item', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function delete(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $path = (string) $request->query->get('path', '');
        $permanent = filter_var($request->query->get('permanent', false), FILTER_VALIDATE_BOOL);
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            $manager->delete($user, $path, $permanent);

            return new JsonResponse(null, 204);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/upload', methods: ['POST'])]
    #[Access('can_write')]
    public function upload(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $folder = (string) $request->request->get('path', 'home://');
        $file = $request->files->get('file');
        if (null === $file) {
            return ApiResponse::badRequest('file is required');
        }

        try {
            $entry = $manager->upload(
                $user,
                $folder,
                (string) $file->getPathname(),
                (string) $file->getClientOriginalName(),
            );

            return $this->json($entry, 201);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/content', methods: ['PUT'])]
    #[Access('can_write')]
    public function writeContent(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $path = (string) ($data['path'] ?? '');
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            return $this->json($manager->writeText($user, $path, (string) ($data['content'] ?? '')));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }
}
