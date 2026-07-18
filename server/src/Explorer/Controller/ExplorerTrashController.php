<?php

namespace Explorer\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use Explorer\Service\TrashService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/explorer/trash')]
#[Access('explorer')]
class ExplorerTrashController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    #[Access('can_read')]
    public function list(Request $request, TrashService $trashService, #[CurrentUser] User $user): JsonResponse
    {
        $disk = (string) $request->query->get('disk', 'home://');
        if (!str_contains($disk, '://')) {
            $disk = $disk.'://';
        }

        try {
            return $this->json([
                'disk' => $disk,
                'items' => $trashService->listTrash($user, $disk),
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/restore', methods: ['POST'])]
    #[Access('can_delete')]
    public function restore(Request $request, TrashService $trashService, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $path = (string) ($data['path'] ?? '');
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            return $this->json($trashService->restore($user, $path));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('', methods: ['DELETE'])]
    #[Access('can_delete')]
    public function empty(Request $request, TrashService $trashService, #[CurrentUser] User $user): JsonResponse
    {
        $disk = (string) $request->query->get('disk', 'home://');
        if (!str_contains($disk, '://')) {
            $disk = $disk.'://';
        }

        try {
            $trashService->emptyTrash($user, $disk);

            return new JsonResponse(null, 204);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }
}
