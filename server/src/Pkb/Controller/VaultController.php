<?php

namespace Pkb\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Pkb\Service\PkbManager;
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
}
