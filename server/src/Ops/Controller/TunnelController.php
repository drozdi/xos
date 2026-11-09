<?php

namespace Ops\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Ops\Service\OpsLinkManager;
use Ops\Service\TunnelRuntime;
use Ssh\Exception\SshHostKeyMismatch;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ops/tunnel', name: 'api_ops_tunnel_')]
#[Access('ssh', checkScopes: false)]
class TunnelController extends AbstractController
{
    public function __construct(
        private readonly OpsLinkManager $links,
        private readonly TunnelRuntime $tunnels,
    ) {
    }

    #[Route('/{id}/start', name: 'start', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('ssh', checkScopes: false)]
    public function start(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $data = $request->toArray();
            $link = $this->links->require($user, 'tunnel', $id);
            $this->tunnels->start($user, $link, true === ($data['accept_host_key'] ?? false));
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
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }

        return $this->json(['running' => true]);
    }

    #[Route('/{id}/stop', name: 'stop', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('ssh', checkScopes: false)]
    public function stop(int $id, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $this->tunnels->stop($user, $this->links->require($user, 'tunnel', $id));
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        }

        return $this->json(['running' => false]);
    }
}
