<?php

namespace Ssh\Controller;

use Main\Entity\User;
use Ssh\Service\SshGatewayTicketService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

final class SshGatewayController extends AbstractController
{
    public function __construct(
        private readonly SshGatewayTicketService $tickets,
    ) {
    }

    #[Route('/api/ssh/gateway/ticket', methods: ['POST'])]
    public function ticket(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        $data = $request->toArray();
        $connectionId = $data['connection_id'] ?? null;
        if (!is_int($connectionId) && !(is_string($connectionId) && ctype_digit($connectionId))) {
            return $this->json(['message' => 'Подключение не указано'], Response::HTTP_BAD_REQUEST);
        }

        try {
            return $this->json($this->tickets->issue($user, (int) $connectionId));
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }
    }

    #[Route('/api/ssh/gateway/redeem', methods: ['POST'])]
    public function redeem(Request $request): JsonResponse
    {
        $data = $request->toArray();
        $ticket = $data['ticket'] ?? '';
        $secret = (string) $request->headers->get('X-Gateway-Secret', '');
        if (!is_string($ticket) || '' === $ticket) {
            return $this->json(['message' => 'Билет не указан'], Response::HTTP_BAD_REQUEST);
        }

        try {
            return $this->json($this->tickets->redeem($ticket, $secret));
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }
    }

    #[Route('/api/ssh/gateway/release', methods: ['POST'])]
    public function release(Request $request): JsonResponse
    {
        $secret = (string) $request->headers->get('X-Gateway-Secret', '');
        $data = $request->toArray();
        $userId = $data['user_id'] ?? 0;
        if (!is_int($userId) && !(is_string($userId) && ctype_digit((string) $userId))) {
            return $this->json(['message' => 'Пользователь не указан'], Response::HTTP_BAD_REQUEST);
        }
        try {
            $this->tickets->release((int) $userId, $secret);
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
