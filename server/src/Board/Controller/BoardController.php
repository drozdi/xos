<?php

namespace Board\Controller;

use App\Attribute\Access;
use Board\Service\BoardManager;
use Main\Entity\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

/**
 * Multi-OU: Board remains global — no OuScope / ou_id tenancy (unlike Main/Device).
 */
#[Route('/api/board')]
#[Access('board')]
class BoardController extends AbstractController
{
    #[Route('/workspaces/{wsId}/boards', requirements: ['wsId' => '\d+'], methods: ['POST'])]
    public function create(int $wsId, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $workspace = $boardManager->getWorkspace($wsId, $user);
        $board = $boardManager->createBoard($workspace, $user, $request->toArray());

        return $this->json($boardManager->serializeBoardDetail($board, $user), Response::HTTP_CREATED);
    }

    #[Route('/boards/{id}', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function detail(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);

        return $this->json($boardManager->serializeBoardDetail($board, $user));
    }

    #[Route('/boards/{id}/cards', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function filterCards(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);

        return $this->json($boardManager->filterBoardCards($board, $user, $this->parseCardFilterQuery($request)));
    }

    #[Route('/boards/{id}', requirements: ['id' => '\d+'], methods: ['PUT'])]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $boardManager->updateBoard($board, $user, $request->toArray());

        return $this->json($boardManager->serializeBoardDetail($board, $user));
    }

    #[Route('/boards/{id}', requirements: ['id' => '\d+'], methods: ['DELETE'])]
    public function delete(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $boardManager->deleteBoard($board, $user);

        return $this->json(['ok' => true]);
    }

    #[Route('/boards/{id}/members', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function listMembers(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);

        return $this->json($boardManager->listBoardMembers($board, $user));
    }

    #[Route('/boards/{id}/members', requirements: ['id' => '\d+'], methods: ['POST'])]
    public function addMember(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $board = $boardManager->getBoard($id, $user);
        $boardManager->addBoardMember(
            $board,
            $user,
            (string) ($data['email'] ?? ''),
            (string) ($data['role'] ?? 'editor'),
        );

        return $this->json($boardManager->listBoardMembers($board, $user), Response::HTTP_CREATED);
    }

    #[Route('/boards/{id}/members/{userId}', requirements: ['id' => '\d+', 'userId' => '\d+'], methods: ['PUT'])]
    public function updateMember(int $id, int $userId, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $data = $request->toArray();
        $board = $boardManager->getBoard($id, $user);
        $boardManager->updateBoardMemberRole(
            $board,
            $user,
            $userId,
            (string) ($data['role'] ?? ''),
        );

        return $this->json($boardManager->listBoardMembers($board, $user));
    }

    #[Route('/boards/{id}/members/{userId}', requirements: ['id' => '\d+', 'userId' => '\d+'], methods: ['DELETE'])]
    public function removeMember(int $id, int $userId, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $boardManager->removeBoardMember($board, $user, $userId);

        return $this->json($boardManager->listBoardMembers($board, $user));
    }

    #[Route('/boards/{id}/activity', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function activity(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $limit = max(1, min(100, (int) $request->query->get('limit', 50)));
        $offset = max(0, (int) $request->query->get('offset', 0));

        return $this->json($boardManager->listBoardActivity($board, $user, $limit, $offset));
    }

    #[Route('/boards/{id}/changes', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function changes(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $since = $request->query->get('since');
        $sinceStr = is_string($since) ? $since : null;

        return $this->json($boardManager->getBoardChanges($board, $user, $sinceStr));
    }

    /** Mercure hub config when MERCURE_URL + MERCURE_JWT_SECRET set; else transport=sse. */
    #[Route('/boards/{id}/realtime', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function realtime(int $id, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);

        return $this->json($boardManager->getRealtimeConfig($board, $user));
    }

    #[Route('/boards/{id}/events', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function events(int $id, Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): StreamedResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $board = $boardManager->getBoard($id, $user);
        $since = $request->query->get('since');
        $sinceStr = is_string($since) ? $since : null;
        $maxSeconds = max(10, min(120, (int) $request->query->get('max_seconds', 55)));
        $boardId = (int) $board->getId();

        $response = new StreamedResponse(function () use ($boardManager, $boardId, $user, $sinceStr, $maxSeconds): void {
            @ini_set('zlib.output_compression', '0');
            @ini_set('output_buffering', '0');
            while (ob_get_level() > 0) {
                ob_end_flush();
            }

            $started = time();
            $cursor = $sinceStr;
            $heartbeatAt = time();

            echo ": connected\n\n";
            flush();

            while (!connection_aborted() && (time() - $started) < $maxSeconds) {
                $board = $boardManager->getBoard($boardId, $user);
                $delta = $boardManager->getBoardChanges($board, $user, $cursor);
                if ($delta['has_changes']) {
                    echo 'event: board_delta'."\n";
                    echo 'data: '.json_encode($delta, \JSON_UNESCAPED_UNICODE)."\n\n";
                    flush();
                }
                if (!empty($delta['server_time']) && is_string($delta['server_time'])) {
                    $cursor = $delta['server_time'];
                }

                if ((time() - $heartbeatAt) >= 15) {
                    echo ": heartbeat\n\n";
                    flush();
                    $heartbeatAt = time();
                }

                usleep(1_500_000);
            }

            echo "event: stream_end\n";
            echo 'data: {"ok":true}'."\n\n";
            flush();
        });

        $response->headers->set('Content-Type', 'text/event-stream; charset=utf-8');
        $response->headers->set('Cache-Control', 'no-cache, no-store');
        $response->headers->set('Connection', 'keep-alive');
        $response->headers->set('X-Accel-Buffering', 'no');

        return $response;
    }

    #[Route('/search', methods: ['GET'])]
    public function search(Request $request, #[CurrentUser] ?User $user, BoardManager $boardManager): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        $q = trim((string) $request->query->get('q', ''));
        $limit = max(1, min(100, (int) $request->query->get('limit', 50)));

        return $this->json(['cards' => $boardManager->searchCards($user, $q, $limit)]);
    }

    /**
     * @return array{
     *     assignee_ids: list<int>,
     *     label_ids: list<int>,
     *     due_before: ?string,
     *     due_after: ?string,
     *     q: string
     * }
     */
    private function parseCardFilterQuery(Request $request): array
    {
        return [
            'assignee_ids' => $this->parseIntListParam($request, 'assignee'),
            'label_ids' => $this->parseIntListParam($request, 'label'),
            'due_before' => $request->query->get('due_before'),
            'due_after' => $request->query->get('due_after'),
            'q' => trim((string) $request->query->get('q', '')),
        ];
    }

    /** @return list<int> */
    private function parseIntListParam(Request $request, string $name): array
    {
        $values = $request->query->all($name);
        if ([] === $values) {
            $single = $request->query->get($name);
            if (is_string($single) && str_contains($single, ',')) {
                $values = explode(',', $single);
            } elseif (null !== $single && '' !== $single) {
                $values = [$single];
            } else {
                $values = [];
            }
        }

        $ids = [];
        foreach ($values as $value) {
            if (is_numeric($value)) {
                $ids[] = (int) $value;
            }
        }

        return array_values(array_unique($ids));
    }
}
