<?php

namespace Pkb\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Pkb\Service\PkbManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/pkb')]
#[Access('pkb')]
class VaultMemberController extends AbstractController
{
    #[Route('/vaults/{id}/members', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function listMembers(int $id, #[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);

        return $this->json($pkbManager->listVaultMembers($vault, $user));
    }

    #[Route('/vaults/{id}/members', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function inviteMember(int $id, Request $request, #[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $vault = $pkbManager->getVault($id, $user);

        $emailOrUserId = '';
        if (isset($data['userId']) && '' !== (string) $data['userId']) {
            $emailOrUserId = (string) $data['userId'];
        } elseif (isset($data['email']) && '' !== trim((string) $data['email'])) {
            $emailOrUserId = trim((string) $data['email']);
        }

        $pkbManager->inviteVaultMember(
            $vault,
            $user,
            $emailOrUserId,
            (string) ($data['role'] ?? 'reader'),
        );

        return $this->json($pkbManager->listVaultMembers($vault, $user), Response::HTTP_CREATED);
    }

    #[Route('/vaults/{id}/members/{userId}', requirements: ['id' => '\d+', 'userId' => '\d+'], methods: ['PUT'])]
    public function updateMember(
        int $id,
        int $userId,
        Request $request,
        #[CurrentUser] ?User $user,
        PkbManager $pkbManager,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $vault = $pkbManager->getVault($id, $user);
        $pkbManager->updateVaultMemberRole(
            $vault,
            $user,
            $userId,
            (string) ($data['role'] ?? ''),
        );

        return $this->json($pkbManager->listVaultMembers($vault, $user));
    }

    #[Route('/vaults/{id}/members/{userId}', requirements: ['id' => '\d+', 'userId' => '\d+'], methods: ['DELETE'])]
    public function removeMember(int $id, int $userId, #[CurrentUser] ?User $user, PkbManager $pkbManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $vault = $pkbManager->getVault($id, $user);
        $pkbManager->removeVaultMember($vault, $user, $userId);

        return $this->json($pkbManager->listVaultMembers($vault, $user));
    }
}
