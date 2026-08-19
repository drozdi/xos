<?php

namespace Board\Controller;

use App\Attribute\Access;
use Board\Entity\Board;
use Board\Service\BoardManager;
use Explorer\Service\ExplorerManager;
use Main\Entity\User;
use Main\Service\FileManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
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
        $board = $card->getBoard();
        if (!$board instanceof Board) {
            return $this->json(['message' => 'Доска не найдена'], Response::HTTP_NOT_FOUND);
        }

        $subDir = $boardManager->resolveBoardAttachmentSubDir($board);

        $field = $request->files->has('attachment') ? 'attachment' : 'board[attachment]';
        $uploaded = $fileManager->upload($field, 'board', null, $subDir);
        if ([] === $uploaded) {
            return $this->json(['message' => 'Укажите файл attachment'], Response::HTTP_BAD_REQUEST);
        }

        $attachment = $boardManager->createAttachmentFromUpload($card, $user, $uploaded[0]);

        return $this->json($boardManager->serializeAttachment($attachment), Response::HTTP_CREATED);
    }

    #[Route('/cards/{cardId}/attachments/import', requirements: ['cardId' => '\d+'], methods: ['POST'])]
    public function import(
        int $cardId,
        Request $request,
        #[CurrentUser] ?User $user,
        BoardManager $boardManager,
        ExplorerManager $explorerManager,
    ): JsonResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $path = trim((string) ($request->toArray()['path'] ?? ''));
        if ('' === $path) {
            return $this->json(['message' => 'Укажите path'], Response::HTTP_BAD_REQUEST);
        }

        $card = $boardManager->getCard($cardId, $user);

        try {
            $info = $explorerManager->info($user, $path);
            if (($info['type'] ?? '') !== 'file') {
                return $this->json(['message' => 'Можно импортировать только файлы'], Response::HTTP_BAD_REQUEST);
            }
            $absolute = $explorerManager->resolveAbsolutePath($user, $path);
            $originalName = (string) ($info['name'] ?? basename($path));
            $attachment = $boardManager->importAttachmentFromLocalPath($card, $user, $absolute, $originalName);
        } catch (\Throwable $e) {
            return $this->json(['message' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($boardManager->serializeAttachment($attachment), Response::HTTP_CREATED);
    }

    #[Route('/attachments/{id}/download', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function download(
        int $id,
        Request $request,
        #[CurrentUser] ?User $user,
        BoardManager $boardManager,
    ): BinaryFileResponse {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $attachment = $boardManager->getAttachment($id, $user);
        $path = $boardManager->resolveAttachmentAbsolutePath($attachment);
        $disposition = 'attachment' === $request->query->get('disposition')
            ? ResponseHeaderBag::DISPOSITION_ATTACHMENT
            : ResponseHeaderBag::DISPOSITION_INLINE;

        $response = new BinaryFileResponse($path);
        $response->setContentDisposition($disposition, $attachment->getFileName());

        return $response;
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
