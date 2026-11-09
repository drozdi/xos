<?php

namespace Ops\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Ops\Service\DockerApi;
use Ops\Service\OpsLinkManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ops/docker', name: 'api_ops_docker_')]
#[Access('ssh', checkScopes: false)]
class DockerController extends AbstractController
{
    public function __construct(
        private readonly OpsLinkManager $links,
        private readonly DockerApi $docker,
    ) {
    }

    #[Route('/{id}/containers', name: 'containers', methods: ['GET'], requirements: ['id' => '\d+'])]
    #[Access('ssh', checkScopes: false)]
    public function containers(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $owner): array => $this->docker->containers($this->links->require($owner, 'docker', $id)));
    }

    #[Route('/{id}/containers/{containerId}/start', name: 'start', methods: ['POST'], requirements: ['id' => '\d+', 'containerId' => '[a-fA-F0-9]{12,64}'])]
    #[Access('ssh', checkScopes: false)]
    public function start(int $id, string $containerId, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, function (User $owner) use ($id, $containerId): array {
            $this->docker->action($this->links->require($owner, 'docker', $id), $containerId, 'start');

            return ['ok' => true];
        });
    }

    #[Route('/{id}/containers/{containerId}/stop', name: 'stop', methods: ['POST'], requirements: ['id' => '\d+', 'containerId' => '[a-fA-F0-9]{12,64}'])]
    #[Access('ssh', checkScopes: false)]
    public function stop(int $id, string $containerId, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, function (User $owner) use ($id, $containerId): array {
            $this->docker->action($this->links->require($owner, 'docker', $id), $containerId, 'stop');

            return ['ok' => true];
        });
    }

    #[Route('/{id}/containers/{containerId}/logs', name: 'logs', methods: ['GET'], requirements: ['id' => '\d+', 'containerId' => '[a-fA-F0-9]{12,64}'])]
    #[Access('ssh', checkScopes: false)]
    public function logs(int $id, string $containerId, #[CurrentUser] ?User $user): JsonResponse
    {
        return $this->call($user, fn (User $owner): array => [
            'text' => $this->docker->logs($this->links->require($owner, 'docker', $id), $containerId),
        ]);
    }

    /**
     * @param callable(User): array<string, mixed> $fn
     */
    private function call(?User $user, callable $fn): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            return $this->json($fn($user));
        } catch (BadRequestHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }
    }
}
