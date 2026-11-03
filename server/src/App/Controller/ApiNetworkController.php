<?php

namespace App\Controller;

use App\Service\EgressAddressService;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/network', name: 'api_network_')]
class ApiNetworkController extends AbstractController
{
    public function __construct(
        private readonly EgressAddressService $egressAddress,
    ) {
    }

    #[Route('/egress', name: 'egress', methods: ['GET'])]
    public function egress(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['message' => 'missing credentials'], Response::HTTP_UNAUTHORIZED);
        }
        $roles = $user->getRoles();
        if (!\in_array('ROLE_ADMIN', $roles, true) && !\in_array('ROLE_ROOT', $roles, true)) {
            return $this->json(['message' => 'Доступ запрещён'], Response::HTTP_FORBIDDEN);
        }

        return $this->json(['ip' => $this->egressAddress->get()]);
    }
}
