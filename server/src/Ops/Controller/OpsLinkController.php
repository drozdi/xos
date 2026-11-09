<?php

namespace Ops\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Ops\Service\OpsLinkManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ops/{kind}', name: 'api_ops_links_', requirements: ['kind' => 'db|docker|vnc|tunnel'])]
#[Access('ssh', checkScopes: false)]
class OpsLinkController extends AbstractController
{
    public function __construct(private readonly OpsLinkManager $links)
    {
    }

    #[Route('', name: 'list', methods: ['GET'])]
    #[Access('ssh', checkScopes: false)]
    public function list(string $kind, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);

        return $this->json($this->links->list($user, $kind));
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[Access('ssh', checkScopes: false)]
    public function create(string $kind, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, function (User $owner) use ($kind, $request): array {
            return $this->links->create($owner, $kind, $request->toArray());
        }, Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('ssh', checkScopes: false)]
    public function update(string $kind, int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, function (User $owner) use ($kind, $id, $request): array {
            return $this->links->update($owner, $kind, $id, $request->toArray());
        });
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[Access('ssh', checkScopes: false)]
    public function delete(string $kind, int $id, #[CurrentUser] ?User $user): Response
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $this->links->delete($user, $kind, $id);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
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
        } catch (BadRequestHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }
    }
}
