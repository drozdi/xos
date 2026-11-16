<?php

namespace Rdp\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Rdp\Service\RdpGatewayTicketService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/rdp/gateway')]
#[Access('rdp', checkScopes: false)]
class RdpGatewayController extends AbstractController
{
    public function __construct(private readonly RdpGatewayTicketService $tickets)
    {
    }

    #[Route('/ticket', name: 'api_rdp_gateway_ticket', methods: ['POST'])]
    #[Access('rdp', checkScopes: false)]
    public function ticket(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $data = $request->toArray();
            $connectionId = $data['connection_id'] ?? null;
            if (!is_int($connectionId) && !(is_string($connectionId) && ctype_digit((string) $connectionId))) {
                return $this->json(['message' => 'Подключение не указано'], Response::HTTP_BAD_REQUEST);
            }

            return $this->json($this->tickets->issue($user, (int) $connectionId));
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }
    }
}
