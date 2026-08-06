<?php

namespace App\Controller;

use App\Service\DesktopStateService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/desktop-state', name: 'api_desktop_state_')]
class ApiDesktopStateController extends AbstractController
{
    public function __construct(
        private readonly DesktopStateService $desktopStateService,
    ) {
    }

    #[Route('', name: 'get', methods: ['GET'])]
    public function get(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json($this->desktopStateService->load($user));
    }

    #[Route('', name: 'put', methods: ['PUT'])]
    public function put(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }

        try {
            $payload = $request->toArray();
        } catch (\Throwable) {
            return $this->json(['message' => 'Invalid JSON body'], Response::HTTP_BAD_REQUEST);
        }

        $result = $this->desktopStateService->save($user, $payload);
        if (!$result['ok']) {
            return $this->json(['message' => $result['message']], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($result['snapshot']);
    }
}
