<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Bundle\SecurityBundle\Security;

use Main\Entity\User;

#[Route('/1api', name: 'api_app_')]
class ApiLoginController extends AbstractController {
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function index(#[CurrentUser] ?User $user): JsonResponse {

        if (null === $user) {
            return $this->json([
                'message' => 'missing credentials',
            ], Response::HTTP_UNAUTHORIZED);
        }
        $token = "hfgh";
        return $this->json([
            //'message' => 'Welcome to your new controller!',
            //'path' => 'src/App/Controller/ApiLoginController.php',
            'user'  => $user->getUserIdentifier(),
            /*'user'  => array(
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
            ),*/
            'token' => $token,
        ]);
    }
    #[Route('/logout', name: 'logout', methods: ['GET'])]
    public function logout(Security $security): never {

        // $response = $security->logout();
        // you can also disable the csrf logout
        //  $response = $security->logout(false);

        // controller can be blank: it will never be called!
        throw new \Exception('Don\'t forget to activate logout in security.yaml');
    }

    #[Route('/refresh-token', name: 'refresh_token', methods: ['POST'])]
    public function refreshToken(): JsonResponse {
        return $this->json([
            'message' => 'Welcome to your new controller!',
            //'path' => 'src/App/Controller/ApiLoginController.php',
        ]);
    }
}
