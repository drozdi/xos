<?php


namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Doctrine\ORM\EntityManagerInterface;

use App\Security\UserScopeResolver;
use Main\Entity\User;
use Main\Service\ClaimantManager;

#[Route('/api/scope', name: 'api_app_scope_' )]
class ApiScopeController extends AbstractController {
     #[Route('/map', name: 'map', methods: ['GET'])]
    public function map (ClaimantManager $cm): JsonResponse {
        $ret = [];
        foreach ($cm->getMap() as $k => $v) {
            $ret[$k] = $v['map-access']??[];
        }
        return $this->json($ret);
    }
    #[Route('/accesses', name: 'accesses', methods: ['GET'])]
    public function accesses (#[CurrentUser] ?User $user, UserScopeResolver $userScopeResolver): JsonResponse {
        return $this->json($userScopeResolver->resolve($user));
    }
}
