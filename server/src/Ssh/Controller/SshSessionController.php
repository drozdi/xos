<?php

namespace Ssh\Controller;

use Main\Entity\User;
use Ssh\Exception\SshHostKeyMismatch;
use Ssh\Service\SshConnectionManager;
use Ssh\Service\SshSessionStore;
use Ssh\Service\SshStream;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ssh/sessions', name: 'api_ssh_sessions_')]
class SshSessionController extends AbstractController
{
    public function __construct(
        private readonly SshConnectionManager $connections,
        private readonly SshSessionStore $sessions,
        private readonly SshStream $stream,
    ) {
    }

    #[Route('', name: 'open', methods: ['POST'])]
    public function open(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $connectionId = $data['connection_id'] ?? null;
        if (!is_int($connectionId) && !(is_string($connectionId) && ctype_digit($connectionId))) {
            return $this->json(['message' => 'Подключение не указано'], Response::HTTP_BAD_REQUEST);
        }

        try {
            return $this->json($this->connections->openSession(
                $user,
                (int) $connectionId,
                true === ($data['accept_host_key'] ?? false),
                (int) ($data['columns'] ?? 80),
                (int) ($data['rows'] ?? 24),
            ));
        } catch (SshHostKeyMismatch $error) {
            return $this->json([
                'message' => $error->getMessage(),
                'code' => 'host_key',
                'fingerprint' => $error->fingerprint,
            ], Response::HTTP_CONFLICT);
        } catch (BadRequestHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }
    }

    #[Route('/{id}/stream', name: 'output', methods: ['GET'], requirements: ['id' => '[a-f0-9]{32}'])]
    public function output(string $id, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $userId = $user->getId();
        if (null === $userId) {
            return $this->json(['message' => 'Пользователь не найден'], Response::HTTP_NOT_FOUND);
        }
        try {
            $this->sessions->requireForUser($userId, $id);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }

        $response = new StreamedResponse(function () use ($user, $id): void {
            $this->stream->run($user, $id);
        });
        $response->headers->set('Content-Type', 'application/octet-stream');
        $response->headers->set('Cache-Control', 'no-cache, no-store');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }

    #[Route('/{id}/input', name: 'input', methods: ['POST'], requirements: ['id' => '[a-f0-9]{32}'])]
    public function input(string $id, Request $request, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $userId = $user->getId();
        if (null === $userId) {
            return $this->json(['message' => 'Пользователь не найден'], Response::HTTP_NOT_FOUND);
        }
        $data = $request->toArray();
        $text = $data['data'] ?? '';
        if (!is_string($text)) {
            return $this->json(['message' => 'Пустой ввод'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $this->sessions->appendInput($userId, $id, $text);
        } catch (\InvalidArgumentException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}', name: 'close', methods: ['DELETE'], requirements: ['id' => '[a-f0-9]{32}'])]
    public function close(string $id, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $userId = $user->getId();
        if (null === $userId) {
            return $this->json(['message' => 'Пользователь не найден'], Response::HTTP_NOT_FOUND);
        }
        try {
            $this->sessions->close($userId, $id);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }
}
