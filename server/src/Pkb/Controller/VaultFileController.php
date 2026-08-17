<?php

namespace Pkb\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Pkb\Service\PkbManager;
use Pkb\Service\VaultFileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/pkb')]
#[Access('pkb')]
class VaultFileController extends AbstractController
{
    #[Route('/vaults/{id}/files/tree', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function tree(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultFileService $vaultFileService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);
        $path = $request->query->get('path');
        $depth = max(1, min(10, (int) $request->query->get('depth', 3)));

        return $this->json($vaultFileService->getTree(
            $vault,
            $user,
            is_string($path) ? $path : null,
            $depth,
        ));
    }

    #[Route('/vaults/{id}/files/content', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function getContent(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultFileService $vaultFileService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $path = (string) $request->query->get('path', '');
        if ('' === $path) {
            return $this->json(['error' => 'path is required'], Response::HTTP_BAD_REQUEST);
        }

        $vault = $pkbManager->getVault($id, $user);
        $content = $vaultFileService->getContent($vault, $user, $path);

        return $this->json(['path' => $path, 'content' => $content]);
    }

    #[Route('/vaults/{id}/files/content', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function putContent(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultFileService $vaultFileService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $path = (string) ($data['path'] ?? '');
        if ('' === $path) {
            return $this->json(['error' => 'path is required'], Response::HTTP_BAD_REQUEST);
        }

        $vault = $pkbManager->getVault($id, $user);
        $entry = $vaultFileService->putContent($vault, $user, $path, (string) ($data['content'] ?? ''));

        return $this->json($entry);
    }

    #[Route('/vaults/{id}/files/upload', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function upload(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultFileService $vaultFileService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $folderPath = (string) $request->request->get('path', '');
        $file = $request->files->get('file');
        if (null === $file) {
            return $this->json(['error' => 'file is required'], Response::HTTP_BAD_REQUEST);
        }

        $vault = $pkbManager->getVault($id, $user);
        $entry = $vaultFileService->uploadFile(
            $vault,
            $user,
            $folderPath,
            (string) $file->getPathname(),
            (string) $file->getClientOriginalName(),
        );

        return $this->json($entry, Response::HTTP_CREATED);
    }

    #[Route('/vaults/{id}/files/folder', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function createFolder(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultFileService $vaultFileService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $path = (string) ($data['path'] ?? '');
        if ('' === $path) {
            return $this->json(['error' => 'path is required'], Response::HTTP_BAD_REQUEST);
        }

        $vault = $pkbManager->getVault($id, $user);
        $entry = $vaultFileService->createFolder($vault, $user, $path);

        return $this->json($entry, Response::HTTP_CREATED);
    }

    #[Route('/vaults/{id}/files/item', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteItem(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultFileService $vaultFileService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $path = (string) $request->query->get('path', '');
        if ('' === $path) {
            return $this->json(['error' => 'path is required'], Response::HTTP_BAD_REQUEST);
        }

        $vault = $pkbManager->getVault($id, $user);
        $vaultFileService->deleteItem($vault, $user, $path);

        return $this->json(['ok' => true]);
    }

    #[Route('/vaults/{id}/files/rename', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function rename(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultFileService $vaultFileService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $fromPath = (string) ($data['fromPath'] ?? '');
        $toPath = (string) ($data['toPath'] ?? '');

        if ('' === $fromPath || '' === $toPath) {
            return $this->json(['error' => 'fromPath and toPath are required'], Response::HTTP_BAD_REQUEST);
        }

        $vault = $pkbManager->getVault($id, $user);
        $entry = $vaultFileService->renameOrMove($vault, $user, $fromPath, $toPath);

        return $this->json($entry);
    }
}
