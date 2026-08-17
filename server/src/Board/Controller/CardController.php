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
class CardController extends AbstractController
{
    #[Route('/lists/{listId}/cards', requirements: ['listId' => '\d+'], methods: ['POST'])]
    public function create(int $listId, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $list = $boardManager->getList($listId, $user);
        $card = $boardManager->createCard($list, $user, $request->toArray());

        return $this->json($boardManager->serializeCardDetail($card), Response::HTTP_CREATED);
    }

    #[Route('/cards/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function detail(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($id, $user);

        return $this->json($boardManager->serializeCardDetail($card));
    }

    #[Route('/cards/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($id, $user);
        $boardManager->updateCard($card, $user, $request->toArray());

        return $this->json($boardManager->serializeCardDetail($card));
    }

    #[Route('/cards/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($id, $user);
        $boardManager->deleteCard($card, $user);

        return $this->json(['ok' => true]);
    }

    #[Route('/cards/{id}/move', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function move(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        if (!isset($data['list_id'], $data['position'])) {
            return $this->json(['message' => 'Укажите list_id и position'], Response::HTTP_BAD_REQUEST);
        }

        $card = $boardManager->getCard($id, $user);
        $boardManager->moveCard($card, $user, (int) $data['list_id'], (int) $data['position']);

        return $this->json($boardManager->serializeCardDetail($card));
    }

    #[Route('/cards/{id}/assignees', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function setAssignees(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $userIds = $data['user_ids'] ?? [];
        if (!is_array($userIds)) {
            return $this->json(['message' => 'user_ids должен быть массивом'], Response::HTTP_BAD_REQUEST);
        }

        $card = $boardManager->getCard($id, $user);
        $boardManager->setCardAssignees($card, $user, array_map('intval', $userIds));

        return $this->json($boardManager->serializeCardDetail($card));
    }

    #[Route('/cards/{id}/labels', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function setLabels(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $labelIds = $data['label_ids'] ?? [];
        if (!is_array($labelIds)) {
            return $this->json(['message' => 'label_ids должен быть массивом'], Response::HTTP_BAD_REQUEST);
        }

        $card = $boardManager->getCard($id, $user);
        $boardManager->setCardLabels($card, $user, array_map('intval', $labelIds));

        return $this->json($boardManager->serializeCardDetail($card));
    }
}
