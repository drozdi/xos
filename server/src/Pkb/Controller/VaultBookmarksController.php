<?php

namespace Pkb\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Pkb\Service\PkbManager;
use Pkb\Service\VaultBookmarksService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/pkb')]
#[Access('pkb')]
class VaultBookmarksController extends AbstractController
{
    #[Route('/vaults/{id}/bookmarks', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function getBookmarks(
        int $id,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultBookmarksService $bookmarksService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);

        return $this->json($bookmarksService->getBookmarks($vault, $user));
    }

    #[Route('/vaults/{id}/bookmarks', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function putBookmarks(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultBookmarksService $bookmarksService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $items = $data['items'] ?? null;
        if (!is_array($items)) {
            return $this->json(['error' => 'items is required'], Response::HTTP_BAD_REQUEST);
        }

        $vault = $pkbManager->getVault($id, $user);

        return $this->json($bookmarksService->putBookmarks($vault, $user, $items));
    }
}
