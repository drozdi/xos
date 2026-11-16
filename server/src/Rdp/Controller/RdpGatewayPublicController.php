<?php

namespace Rdp\Controller;

use Rdp\Service\RdpGatewayTicketService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;

final class RdpGatewayPublicController extends AbstractController
{
    public function __construct(private readonly RdpGatewayTicketService $tickets)
    {
    }

    #[Route('/api/rdp/gateway/redeem', name: 'api_rdp_gateway_redeem', methods: ['POST'])]
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

    #[Route('/api/rdp/gateway/release', name: 'api_rdp_gateway_release', methods: ['POST'])]
    public function release(Request $request): JsonResponse
    {
        $secret = (string) $request->headers->get('X-Gateway-Secret', '');
        $data = $request->toArray();
        $userId = $data['user_id'] ?? 0;
        if (!is_int($userId) && !(is_string($userId) && ctype_digit((string) $userId))) {
            return $this->json(['message' => 'Пользователь не указан'], Response::HTTP_BAD_REQUEST);
        }
        $connectionId = $data['connection_id'] ?? null;
        try {
            $this->tickets->release(
                (int) $userId,
                $secret,
                is_int($connectionId) || (is_string($connectionId) && ctype_digit($connectionId)) ? (int) $connectionId : null,
            );
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }

        return new JsonResponse(null, Response::HTTP_NO_CONTENT);
    }
}
