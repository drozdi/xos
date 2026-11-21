<?php

namespace Samba\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Samba\Service\SambaAgentService;
use Samba\Service\SambaCommandService;
use Samba\Service\SambaImportService;
use Samba\Service\SambaServerManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/samba/servers', name: 'api_samba_servers_')]
#[Access('samba', checkScopes: false)]
class SambaServerController extends AbstractController
{
    public function __construct(
        private readonly SambaServerManager $servers,
        private readonly SambaAgentService $agents,
        private readonly SambaCommandService $commands,
        private readonly SambaImportService $import,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[Access('samba', checkScopes: false)]
    public function list(#[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($this->servers->list($user));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[Access('samba', checkScopes: false)]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->servers->create($actor, $request->toArray()), Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function get(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->servers->get($actor, $id));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->servers->update($actor, $id, $request->toArray()));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function delete(int $id, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $this->servers->delete($user, $id);
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/access', name: 'grant', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function grant(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->servers->grant($actor, $id, $request->toArray()));
    }

    #[Route('/{id}/access/{userId}', name: 'revoke', methods: ['DELETE'], requirements: ['id' => '\d+', 'userId' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function revoke(int $id, int $userId, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $this->servers->revoke($user, $id, $userId);
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/transfer', name: 'transfer', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function transfer(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, function (User $actor) use ($id, $request): array {
            $data = $request->toArray();

            return $this->servers->transfer($actor, $id, (int) ($data['user_id'] ?? 0));
        });
    }

    #[Route('/{id}/import-map', name: 'import_map_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function importMap(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->import->map($actor, $id));
    }

    #[Route('/{id}/import-map', name: 'import_map_save', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function saveImportMap(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->import->saveMap($actor, $id, $request->toArray()));
    }

    #[Route('/{id}/import', name: 'import', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function import(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->import->run($actor, $id, $request->toArray()));
    }

    #[Route('/{id}/directory', name: 'directory', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function directory(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->commands->directory($actor, $id));
    }

    #[Route('/{id}/commands', name: 'command_create', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function commandCreate(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->commands->enqueue($actor, $id, $request->toArray()), Response::HTTP_CREATED);
    }

    #[Route('/{id}/commands/{commandId}', name: 'command_get', methods: ['GET'], requirements: ['id' => '\d+', 'commandId' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function commandGet(int $id, int $commandId, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->commands->get($actor, $id, $commandId));
    }

    #[Route('/{id}/agent-token', name: 'agent_token', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function agentToken(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->servers->rotateAgentToken($actor, $id));
    }

    #[Route('/{id}/enrollment', name: 'enrollment', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function enrollment(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, function (User $actor) use ($id, $request): array {
            $card = $this->servers->get($actor, $id);
            if (true !== ($card['owner'] ?? false)) {
                throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException('Установку выдаёт владелец');
            }

            return $this->agents->issueEnrollment($actor, $this->agents->requireServer($id), $request->getSchemeAndHttpHost());
        });
    }

    #[Route('/{id}/log', name: 'log', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('samba', checkScopes: false)]
    public function log(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $actor): array => $this->servers->log($actor, $id));
    }

    /**
     * @param callable(User): array<string, mixed> $fn
     */
    private function call(?User $user, callable $fn, int $status = Response::HTTP_OK): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            return $this->json($fn($user), $status);
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }
    }
}
