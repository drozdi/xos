<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Bundle\SecurityBundle\Security;

use Main\Entity\User;

#[Route('/api', name: 'api_app_')]
class ApiLoginController extends AbstractController {
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(#[CurrentUser] ?User $user): JsonResponse {
        /*if (null === $user) {
            return $this->json([
                'message' => 'missing credentials',
            ], Response::HTTP_UNAUTHORIZED);
        }
        $token = "hfgh";
        return $this->json([
            'user'  => $user->getUserIdentifier(),
            'token' => $token,
        ]);*/
    }
    #[Route('/logout', name: 'logout', methods: ['GET'])]
    public function logout(Security $security): never {

        // $response = $security->logout();
        // you can also disable the csrf logout
        //  $response = $security->logout(false);

        // controller can be blank: it will never be called!
        throw new \Exception('Don\'t forget to activate logout in security.yaml');
    }

    #[Route('/login-check', name: 'login_check', methods: ['GET'])]
    public function check(Security $security): JsonResponse {
        $user = $security->getUser();

        if (!$user) {
            return $this->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        return $this->json([
            'status' => 'authenticated',
        ]);
    }



    #[Route('/user', name: 'user', methods: ['GET'])]
    public function user(Security $security): JsonResponse {
        $user = $this->getUser();

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'roles' => $user->getRoles(),
        ]);
    }


    #[Route('/protected', name: 'protected', methods: ['GET'])]
    public function protected(): JsonResponse  {
        return $this->json([
            'message' => 'This is protected data!',
            'user' => $this->getUser()->getEmail()
        ]);
    }
    #[Route('/refresh-token', name: 'refresh_token', methods: ['POST'])]
    public function refreshToken(): JsonResponse {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            //'path' => 'src/App/Controller/ApiLoginController.php',
        ]);
    }
}
