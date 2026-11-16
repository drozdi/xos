<?php

namespace Rdp\Controller;

use App\Attribute\Access;
use App\Security\UserScopeResolver;
use Main\Entity\User;
use Rdp\Service\RdpNetworkManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/rdp', name: 'api_rdp_networks_')]
#[Access('rdp', checkScopes: false)]
class RdpNetworkController extends AbstractController
{
    public function __construct(
        private readonly RdpNetworkManager $networks,
        private readonly UserScopeResolver $scopes,
    ) {
    }

    #[Route('/networks', name: 'mine', methods: ['GET'])]
    #[Access('rdp', checkScopes: false)]
    public function mine(#[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($this->networks->listGranted($user));
    }

    #[Route('/admin/networks', name: 'admin_list', methods: ['GET'])]
    #[Access('rdp', checkScopes: false)]
    public function list(#[CurrentUser] ?User $user): JsonResponse
    {
        $this->assertRoot($user);

        return $this->json($this->networks->listAll());
    }

    #[Route('/admin/networks', name: 'admin_create', methods: ['POST'])]
    #[Access('rdp', checkScopes: false)]
    public function create(Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $owner = $this->assertRoot($user);
        try {
            return $this->json($this->networks->create($owner, $request->toArray()), Response::HTTP_CREATED);
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }
    }

    #[Route('/admin/networks/{id}', name: 'admin_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('rdp', checkScopes: false)]
    public function update(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $owner = $this->assertRoot($user);
        try {
            return $this->json($this->networks->update($owner, $id, $request->toArray()));
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }
    }

    #[Route('/admin/networks/{id}', name: 'admin_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[Access('rdp', checkScopes: false)]
    public function delete(int $id, #[CurrentUser] ?User $user): Response
    {
        $owner = $this->assertRoot($user);
        try {
            $this->networks->delete($owner, $id);
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }

        return new Response(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/admin/networks/{id}/grants', name: 'admin_grants_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('rdp', checkScopes: false)]
    public function grants(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->assertRoot($user);
        $rows = array_values(array_filter(
            $this->networks->listAll(),
            static fn (array $network): bool => ($network['id'] ?? null) === $id,
        ));
        if ([] === $rows) {
            return $this->json(['message' => 'Сеть не найдена'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($rows[0]['grants'] ?? []);
    }

    #[Route('/admin/networks/{id}/grants', name: 'admin_grants_put', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('rdp', checkScopes: false)]
    public function replaceGrants(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $owner = $this->assertRoot($user);
        try {
            $data = $request->toArray();
            $grants = $data['grants'] ?? [];
            if (!is_array($grants)) {
                return $this->json(['message' => 'Выдача заполнена неверно'], Response::HTTP_BAD_REQUEST);
            }

            return $this->json($this->networks->replaceGrants($owner, $id, $grants));
        } catch (HttpExceptionInterface $error) {
            return $this->json(['message' => $error->getMessage()], $error->getStatusCode());
        }
    }

    private function assertRoot(?User $user): User
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        if (!$this->scopes->hasFullAppAccess($user, 'rdp')) {
            throw new AccessDeniedHttpException('Недостаточно прав');
        }

        return $user;
    }
}
