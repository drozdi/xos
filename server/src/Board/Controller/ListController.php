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
class ListController extends AbstractController
{
    #[Route('/boards/{id}/lists', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function create(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $list = $boardManager->createList($board, $user, $request->toArray());

        return $this->json($boardManager->serializeList($list), Response::HTTP_CREATED);
    }

    #[Route('/lists/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $boardManager->getList($id, $user);
        $boardManager->updateList($list, $user, $request->toArray());

        return $this->json($boardManager->serializeList($list));
    }

    #[Route('/lists/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $boardManager->getList($id, $user);
        $boardManager->deleteList($list, $user);

        return $this->json(['ok' => true]);
    }

    #[Route('/boards/{id}/lists/reorder', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function reorder(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $data = $request->toArray();
        $orders = $data['orders'] ?? [];
        if (!is_array($orders)) {
            $orders = [];
        }
        $boardManager->reorderLists($board, $user, $orders);

        return $this->json($boardManager->serializeBoardDetail($board, $user));
    }
}
