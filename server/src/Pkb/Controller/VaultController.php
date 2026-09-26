<?php

namespace Pkb\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Pkb\Service\PkbManager;
use Pkb\Service\VaultExportService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/pkb')]
#[Access('pkb')]
class VaultController extends AbstractController
{
    #[Route('/vaults', methods: ['GET'])]
    public function list(#[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($pkbManager->listVaultsForUser($user));
    }

    #[Route('/vaults', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->createVault($user, $request->toArray());

        return $this->json($pkbManager->serializeVaultDetail($vault, $user), Response::HTTP_CREATED);
    }

    #[Route('/vaults/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function detail(int $id, #[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);

        return $this->json($pkbManager->serializeVaultDetail($vault, $user));
    }

    #[Route('/vaults/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);
        $pkbManager->updateVault($vault, $user, $request->toArray());

        return $this->json($pkbManager->serializeVaultDetail($vault, $user));
    }

    #[Route('/vaults/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, Request $request, #[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);
        $deleteFiles = filter_var($request->query->get('deleteFiles', false), FILTER_VALIDATE_BOOL);
        $pkbManager->deleteVault($vault, $user, $deleteFiles);

        return $this->json(['ok' => true]);
    }

    #[Route('/vaults/{id}/export', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function export(
        int $id,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultExportService $exportService,
    ): Response {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);

        return $exportService->exportZipResponse($vault, $user);
    }

    /** Push vault ZIP to config.remote_sync_url (multipart field vault). */
    #[Route('/vaults/{id}/remote-sync', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function remoteSync(
        int $id,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
        VaultExportService $exportService,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);
        $detail = $pkbManager->serializeVaultDetail($vault, $user);
        if (!($detail['permissions']['can_update'] ?? false)) {
            return $this->json(['error' => 'Нет прав на remote sync'], Response::HTTP_FORBIDDEN);
        }
        $url = $pkbManager->getRemoteSyncUrl($vault, $user);
        if (null === $url) {
            return $this->json(['error' => 'remote_sync_url не задан'], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($exportService->pushRemoteSync($vault, $user, $url));
    }
}
