<?php

namespace Rdp\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Rdp\Service\RdpConnectionManager;
use Rdp\Service\RdpHostPolicy;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/rdp/connections', name: 'api_rdp_connections_')]
#[Access('rdp', checkScopes: false)]
class RdpConnectionController extends AbstractController
{
    public function __construct(
        private readonly RdpConnectionManager $connections,
        private readonly RdpHostPolicy $policy,
    ) {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[Access('rdp', checkScopes: false)]
    public function list(#[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($this->connections->list($user));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[Access('rdp', checkScopes: false)]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $owner): array => $this->connections->create($owner, $request->toArray()), Response::HTTP_CREATED);
    }

    #[Route('/check-host', name: 'check_host', methods: ['POST'])]
    #[Access('rdp', checkScopes: false)]
    public function checkHost(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        $data = $request->toArray();

        return $this->json($this->policy->describe($user, (string) ($data['host'] ?? '')));
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('rdp', checkScopes: false)]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $owner): array => $this->connections->update($owner, $id, $request->toArray()));
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[Access('rdp', checkScopes: false)]
    public function delete(int $id, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $this->connections->delete($user, $id);
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
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
