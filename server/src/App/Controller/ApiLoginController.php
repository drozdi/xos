<?php

namespace App\Controller;

use App\Security\UserScopeResolver;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api', name: 'api_app_')]
class ApiLoginController extends AbstractController
{
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): never
    {
        throw new \LogicException('Login is handled by the security firewall.');
    }

    #[Route('/login-check', name: 'login_check', methods: ['GET'])]
    public function check(Security $security): JsonResponse
    {
        $user = $security->getUser();

        if (!$user) {
            return $this->json([
                'error' => 'Unauthorized',
            ], 401);
        }

        return $this->json([
            'status' => 'authenticated',
        ]);
    }

    #[Route('/user', name: 'user', methods: ['GET'])]
    public function user(UserScopeResolver $userScopeResolver): JsonResponse
    {
        $user = $this->getUser();
        if (!$user instanceof User) {
            return $this->json([
                'error' => 'Unauthorized',
            ], 401);
        }

        return $this->json($userScopeResolver->serializeUser($user));
    }

    #[Route('/protected', name: 'protected', methods: ['GET'])]
    public function protected(): JsonResponse
    {
        return $this->json([
            'message' => 'This is protected data!',
            'user' => $this->getUser()->getEmail(),
        ]);
    }
}
