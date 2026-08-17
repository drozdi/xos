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
class ChecklistController extends AbstractController
{
    #[Route('/cards/{cardId}/checklists', requirements: ['cardId' => '\d+'], methods: ['POST'])]
    public function create(int $cardId, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($cardId, $user);
        $checklist = $boardManager->createChecklist($card, $user, $request->toArray());

        return $this->json($boardManager->serializeChecklist($checklist), Response::HTTP_CREATED);
    }

    #[Route('/checklists/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $checklist = $boardManager->getChecklist($id, $user);
        $boardManager->updateChecklist($checklist, $user, $request->toArray());

        return $this->json($boardManager->serializeChecklist($checklist));
    }

    #[Route('/checklists/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $checklist = $boardManager->getChecklist($id, $user);
        $boardManager->deleteChecklist($checklist, $user);

        return $this->json(['ok' => true]);
    }

    #[Route('/checklists/{id}/items', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function addItem(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $checklist = $boardManager->getChecklist($id, $user);
        $item = $boardManager->addChecklistItem($checklist, $user, $request->toArray());

        return $this->json([
            'id' => $item->getId(),
            'text' => $item->getText(),
            'checked' => $item->isChecked(),
            'position' => $item->getPosition(),
        ], Response::HTTP_CREATED);
    }

    #[Route('/checklist-items/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function updateItem(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $item = $boardManager->getChecklistItem($id, $user);
        $boardManager->updateChecklistItem($item, $user, $request->toArray());

        return $this->json([
            'id' => $item->getId(),
            'text' => $item->getText(),
            'checked' => $item->isChecked(),
            'position' => $item->getPosition(),
        ]);
    }

    #[Route('/checklist-items/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function deleteItem(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $item = $boardManager->getChecklistItem($id, $user);
        $boardManager->deleteChecklistItem($item, $user);

        return $this->json(['ok' => true]);
    }
}
