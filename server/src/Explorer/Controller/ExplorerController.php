<?php

namespace Explorer\Controller;

use App\Attribute\Access;
use App\Http\ApiResponse;
use Explorer\Service\ExplorerManager;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/explorer')]
#[Access('explorer')]
class ExplorerController extends AbstractController
{
    #[Route('/config', methods: ['GET'])]
    #[Access('can_read')]
    public function config(ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        return $this->json($manager->getConfig($user));
    }

    #[Route('/list', methods: ['GET'])]
    #[Access('can_read')]
    public function list(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $path = (string) $request->query->get('path', 'home://');
        $sortBy = (string) $request->query->get('sortBy', 'name');
        $sortDir = (string) $request->query->get('sortDir', 'asc');

        try {
            $items = $manager->list($user, $path, $sortBy, $sortDir);
            foreach ($items as &$item) {
                $item['path'] = $this->buildItemPath($path, (string) ($item['relativePath'] ?? ''));
            }

            return $this->json([
                'path' => $path,
                'sortBy' => $sortBy,
                'sortDir' => $sortDir,
                'items' => $items,
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/tree', methods: ['GET'])]
    #[Access('can_read')]
    public function tree(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $path = (string) $request->query->get('path', 'home://');
        $depth = max(1, (int) $request->query->get('depth', 2));

        try {
            return $this->json($manager->tree($user, $path, $depth));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/info', methods: ['GET'])]
    #[Access('can_read')]
    public function info(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): JsonResponse
    {
        $path = (string) $request->query->get('path', '');
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            return $this->json($manager->info($user, $path));
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/download', methods: ['GET'])]
    #[Access('can_read')]
    public function download(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): Response
    {
        $path = (string) $request->query->get('path', '');
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            return $this->streamFile($manager, $user, $path, ResponseHeaderBag::DISPOSITION_ATTACHMENT);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    #[Route('/content', methods: ['GET'])]
    #[Access('can_read')]
    public function content(Request $request, ExplorerManager $manager, #[CurrentUser] User $user): Response
    {
        $path = (string) $request->query->get('path', '');
        if ('' === $path) {
            return ApiResponse::badRequest('path is required');
        }

        try {
            return $this->streamFile($manager, $user, $path, ResponseHeaderBag::DISPOSITION_INLINE);
        } catch (\Throwable $e) {
            return ApiResponse::badRequest($e->getMessage());
        }
    }

    private function streamFile(ExplorerManager $manager, User $user, string $path, string $disposition): StreamedResponse
    {
        $info = $manager->info($user, $path);
        if ('folder' === ($info['type'] ?? '')) {
            throw new \InvalidArgumentException(
                ResponseHeaderBag::DISPOSITION_ATTACHMENT === $disposition
                    ? 'Cannot download a folder'
                    : 'Cannot read folder as content',
            );
        }

        $fileName = (string) ($info['name'] ?? 'file');
        $stream = $manager->openDownload($user, $path);
        $response = new StreamedResponse(static function () use ($stream): void {
            try {
                fpassthru($stream);
            } finally {
                fclose($stream);
            }
        });
        $response->headers->set('Content-Type', 'application/octet-stream');
        $response->headers->set(
            'Content-Disposition',
            $response->headers->makeDisposition($disposition, $fileName),
        );

        return $response;
    }

    private function buildItemPath(string $folderUri, string $relativePath): string
    {
        if (!preg_match('#^([a-zA-Z0-9_-]+)://#', $folderUri, $matches)) {
            return $relativePath;
        }
        $disk = strtolower($matches[1]);
        if ('' === $relativePath || '/' === $relativePath) {
            return $disk.'://';
        }

        return $disk.'://'.trim($relativePath, '/');
    }
}
