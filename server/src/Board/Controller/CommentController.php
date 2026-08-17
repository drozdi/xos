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
class CommentController extends AbstractController
{
    #[Route('/cards/{cardId}/comments', requirements: ['cardId' => '\d+'], methods: ['GET'])]
    public function list(int $cardId, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($cardId, $user);

        return $this->json($boardManager->listComments($card, $user));
    }

    #[Route('/cards/{cardId}/comments', requirements: ['cardId' => '\d+'], methods: ['POST'])]
    public function create(int $cardId, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($cardId, $user);
        $comment = $boardManager->createComment($card, $user, $request->toArray());

        return $this->json($boardManager->serializeComment($comment), Response::HTTP_CREATED);
    }

    #[Route('/comments/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $comment = $boardManager->getComment($id, $user);
        $boardManager->updateComment($comment, $user, $request->toArray());

        return $this->json($boardManager->serializeComment($comment));
    }

    #[Route('/comments/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $comment = $boardManager->getComment($id, $user);
        $boardManager->deleteComment($comment, $user);

        return $this->json(['ok' => true]);
    }
}
