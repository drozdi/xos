<?php

namespace Board\Controller;

use App\Attribute\Access;
use Board\Service\BoardManager;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/board')]
#[Access('board')]
class WorkspaceController extends AbstractController
{
    #[Route('/workspaces', methods: ['GET'])]
    public function list(#[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($boardManager->listWorkspacesForUser($user));
    }

    #[Route('/workspaces', methods: ['POST'])]
    public function create(Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $workspace = $boardManager->createWorkspace($user, $request->toArray());

        return $this->json($boardManager->serializeWorkspaceDetail($workspace, $user), Response::HTTP_CREATED);
    }

    #[Route('/workspaces/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function detail(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $workspace = $boardManager->getWorkspace($id, $user);

        return $this->json($boardManager->serializeWorkspaceDetail($workspace, $user));
    }

    #[Route('/workspaces/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $workspace = $boardManager->getWorkspace($id, $user);
        $boardManager->updateWorkspace($workspace, $user, $request->toArray());

        return $this->json($boardManager->serializeWorkspaceDetail($workspace, $user));
    }

    #[Route('/workspaces/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $workspace = $boardManager->getWorkspace($id, $user);
        $boardManager->deleteWorkspace($workspace, $user);

        return $this->json(['ok' => true]);
    }

    #[Route('/workspaces/{id}/members', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function listMembers(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $workspace = $boardManager->getWorkspace($id, $user);

        return $this->json($boardManager->listWorkspaceMembers($workspace, $user));
    }

    #[Route('/workspaces/{id}/members', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function inviteMember(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $workspace = $boardManager->getWorkspace($id, $user);
        $boardManager->inviteWorkspaceMember(
            $workspace,
            $user,
            (string) ($data['email'] ?? ''),
            (string) ($data['role'] ?? 'editor'),
        );

        return $this->json($boardManager->listWorkspaceMembers($workspace, $user), Response::HTTP_CREATED);
    }

    #[Route('/workspaces/{id}/members/{userId}', requirements: ['id' => '\d+', 'userId' => '\d+'], methods: ['PUT'])]
    public function updateMember(int $id, int $userId, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $workspace = $boardManager->getWorkspace($id, $user);
        $boardManager->updateWorkspaceMemberRole(
            $workspace,
            $user,
            $userId,
            (string) ($data['role'] ?? ''),
        );

        return $this->json($boardManager->listWorkspaceMembers($workspace, $user));
    }

    #[Route('/workspaces/{id}/members/{userId}', requirements: ['id' => '\d+', 'userId' => '\d+'], methods: ['DELETE'])]
    public function removeMember(int $id, int $userId, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $workspace = $boardManager->getWorkspace($id, $user);
        $boardManager->removeWorkspaceMember($workspace, $user, $userId);

        return $this->json($boardManager->listWorkspaceMembers($workspace, $user));
    }
}
