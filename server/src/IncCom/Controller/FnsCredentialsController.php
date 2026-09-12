<?php

namespace IncCom\Controller;

use IncCom\Service\FnsReceiptService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/IncCom/fns/credentials', name: 'api_inccom_fns_credentials_')]
class FnsCredentialsController extends AbstractController
{
    public function __construct(
        private readonly FnsReceiptService $fnsReceiptService,
    ) {
    }

    #[Route('', name: 'get', methods: ['GET'])]
    public function get(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->fnsReceiptService->serializeCredentialPublic($user));
    }

    #[Route('', name: 'put', methods: ['PUT'])]
    public function put(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $this->fnsReceiptService->upsertCredential($user, $request->toArray());

        return $this->json($this->fnsReceiptService->serializeCredentialPublic($user));
    }

    #[Route('', name: 'delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $this->fnsReceiptService->deleteCredential($user);

        return $this->json(['ok' => true]);
    }
}
