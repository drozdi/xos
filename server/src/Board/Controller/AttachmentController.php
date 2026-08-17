<?php

namespace Board\Controller;

use App\Attribute\Access;
use Board\Service\BoardManager;
use Main\Entity\User;
use Main\Service\FileManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/board')]
#[Access('board')]
class AttachmentController extends AbstractController
{
    #[Route('/cards/{cardId}/attachments', requirements: ['cardId' => '\d+'], methods: ['GET'])]
    public function list(int $cardId, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($cardId, $user);

        return $this->json($boardManager->listAttachments($card, $user));
    }

    #[Route('/cards/{cardId}/attachments', requirements: ['cardId' => '\d+'], methods: ['POST'])]
    public function upload(int $cardId, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager, FileManager $fileManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $card = $boardManager->getCard($cardId, $user);

        $uploaded = $fileManager->upload('board[attachment]', 'board');
        if ([] === $uploaded && $request->files->has('attachment')) {
            $uploaded = $fileManager->upload('attachment', 'board');
        }
        if ([] === $uploaded) {
            return $this->json(['message' => 'Укажите файл attachment'], Response::HTTP_BAD_REQUEST);
        }

        $attachment = $boardManager->createAttachmentFromUpload($card, $user, $uploaded[0]);

        return $this->json($boardManager->serializeAttachment($attachment), Response::HTTP_CREATED);
    }

    #[Route('/attachments/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $attachment = $boardManager->getAttachment($id, $user);
        $boardManager->deleteAttachment($attachment, $user);

        return $this->json(['ok' => true]);
    }
}
