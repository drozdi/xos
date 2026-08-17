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
class LabelController extends AbstractController
{
    #[Route('/boards/{id}/labels', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function create(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $label = $boardManager->createLabel($board, $user, $request->toArray());

        return $this->json($boardManager->serializeLabel($label), Response::HTTP_CREATED);
    }

    #[Route('/labels/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $label = $boardManager->getLabel($id, $user);
        $boardManager->updateLabel($label, $user, $request->toArray());

        return $this->json($boardManager->serializeLabel($label));
    }

    #[Route('/labels/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $label = $boardManager->getLabel($id, $user);
        $boardManager->deleteLabel($label, $user);

        return $this->json(['ok' => true]);
    }
}
