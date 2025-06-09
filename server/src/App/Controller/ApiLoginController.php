<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

use Main\Entity\User;

class ApiLoginController extends AbstractController {
    #[Route('/api/login', name: 'app_api_login')]
    public function index(#[CurrentUser] ?User $user): JsonResponse {
        if (null === $user) {
            return $this->json([
                'message' => 'missing credentials',
            ], Response::HTTP_UNAUTHORIZED);
        }
        $token = "hfgh";
        return $this->json([
            'message' => 'Welcome to your new controller!',
            'path' => 'src/App/Controller/ApiLoginController.php',
            //'user'  => $user->getUserIdentifier(),
            'user'  => array(
                'id' => $user->getId(),
                'login' => $user->getLogin(),
                'email' => $user->getEmail(),
                'phone' => $user->getPhone(),
                'alias' => $user->getAlias(),
                'first_name' => $user->getFirstName(),
                'second_name' => $user->getSecondName(),
                'patronymic' => $user->getPatronymic(),
                'description' => $user->getDescription(),
                'roles' => $user->getRoles()
            ),
            'token' => $token,
        ]);
    }
    #[Route('/api/logout', name: 'app_api_logout', methods: ['GET'])]
    public function logout(): never {
        // controller can be blank: it will never be called!
        throw new \Exception('Don\'t forget to activate logout in security.yaml');
    }
}
