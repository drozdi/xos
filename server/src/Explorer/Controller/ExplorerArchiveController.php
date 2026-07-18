<?php

namespace Explorer\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use Explorer\Service\ArchiveService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/explorer/archive')]
#[Access('explorer')]
class ExplorerArchiveController extends AbstractController
{
    #[Route('/list', methods: ['GET'])]
    #[Access('can_read')]
    public function list(Request $request, ArchiveService $archiveService, #[CurrentUser] User $user): JsonResponse
    {
        $path = (string) $request->query->get('path', '');
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            return $this->json([
                'path' => $path,
                'items' => $archiveService->listContents($user, $path),
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/pack', methods: ['POST'])]
    #[Access('can_write')]
    public function pack(Request $request, ArchiveService $archiveService, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $sources = $data['sources'] ?? $data['paths'] ?? [];
        $destination = (string) ($data['destination'] ?? $data['target'] ?? '');
        if (!is_array($sources) || [] === $sources || '' === $destination) {
            return ApiResponse::badRequest('sources and destination are required');
        }

        try {
            /** @var list<string> $sourceUris */
            $sourceUris = array_values(array_map('strval', $sources));

            return $this->json($archiveService->pack($user, $sourceUris, $destination), 201);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/unpack', methods: ['POST'])]
    #[Access('can_write')]
    public function unpack(Request $request, ArchiveService $archiveService, #[CurrentUser] User $user): JsonResponse
    {
        $data = $request->toArray();
        $archive = (string) ($data['archive'] ?? $data['path'] ?? '');
        $destination = (string) ($data['destination'] ?? $data['target'] ?? '');
        if ('' === $archive || '' === $destination) {
            return ApiResponse::badRequest('archive and destination are required');
        }

        try {
            return $this->json($archiveService->unpack($user, $archive, $destination));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }
}
