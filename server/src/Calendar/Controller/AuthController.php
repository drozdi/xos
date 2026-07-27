<?php

namespace Calendar\Controller;

use App\Entity\RefreshToken;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/calendar/auth', name: 'api_calendar_auth_')]
class AuthController extends AbstractController
{
    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if (null === $user) {
            return $this->json(['error' => 'Unauthorized'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            ...$this->mapUser($user),
            'roles' => $user->getRoles(),
        ]);
    }

    /**
     * Реальный вход обрабатывает firewall calendar_login (json_login).
     */
    #[Route('/login', name: 'login', methods: ['POST'])]
    public function login(): never
    {
        throw new \LogicException('Calendar login is handled by the security firewall.');
    }

    #[Route('/login', name: 'login_doc', methods: ['GET'])]
    public function loginDoc(): JsonResponse
    {
        return $this->json([
            'hint' => 'POST /api/calendar/auth/login with JSON {"username":"<email>","password":"..."}',
        ]);
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(Request $request, EntityManagerInterface $entityManager): JsonResponse
    {
        $data = $request->toArray();
        $refreshTokenValue = $data['refresh_token'] ?? null;

        if (!is_string($refreshTokenValue) || '' === $refreshTokenValue) {
            return $this->json([
                'error' => 'Validation failed',
                'violations' => ['refresh_token' => 'Refresh token is required'],
            ], Response::HTTP_BAD_REQUEST);
        }

        $refreshToken = $entityManager->getRepository(RefreshToken::class)
            ->findOneBy(['refreshToken' => $refreshTokenValue]);

        if (null !== $refreshToken) {
            $entityManager->remove($refreshToken);
            $entityManager->flush();
        }

        return $this->json(['success' => true]);
    }

    /**
     * @return array{id: int|null, login: string|null, email: string|null, name: string|null}
     */
    private function mapUser(User $user): array
    {
        return [
            'id' => $user->getId(),
            'login' => $user->getLogin(),
            'email' => $user->getEmail(),
            'name' => $user->getAlias(),
        ];
    }
}
