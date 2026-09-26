<?php

namespace Github\Controller;

use App\Attribute\Access;
use Github\Service\GithubConnectionService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/github/credentials', name: 'api_github_credentials_')]
#[Access('github')]
class GithubCredentialsController extends AbstractController
{
    public function __construct(
        private readonly GithubConnectionService $connectionService,
    ) {
    }

    #[Route('', name: 'get', methods: ['GET'])]
    public function get(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->connectionService->serializeCredentialPublic($user));
    }

    #[Route('', name: 'put', methods: ['PUT'])]
    public function put(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $this->connectionService->upsertCredential($user, $request->toArray());
        } catch (BadRequestHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($this->connectionService->serializeCredentialPublic($user));
    }

    #[Route('', name: 'delete', methods: ['DELETE'])]
    public function delete(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        $this->connectionService->deleteCredential($user);

        return $this->json(['ok' => true]);
    }
}
