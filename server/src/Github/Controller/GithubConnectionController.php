<?php

namespace Github\Controller;

use App\Attribute\Access;
use Github\Service\GithubConnectionService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/github/connection', name: 'api_github_connection_')]
#[Access('github')]
class GithubConnectionController extends AbstractController
{
    public function __construct(
        private readonly GithubConnectionService $connectionService,
    ) {
    }

    #[Route('/test', name: 'test', methods: ['POST'])]
    public function test(#[CurrentUser] ?User $user): JsonResponse
    {
        if ($user === null) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $result = $this->connectionService->testConnection($user);
        } catch (BadRequestHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($result, $result['ok'] ? Response::HTTP_OK : Response::HTTP_BAD_GATEWAY);
    }
}
