<?php

namespace Ops\Controller;

use App\Attribute\Access;
use Main\Entity\User;
use Ops\Service\DbQuery;
use Ops\Service\OpsLinkManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/ops/db', name: 'api_ops_db_')]
#[Access('ssh', checkScopes: false)]
class DbQueryController extends AbstractController
{
    public function __construct(
        private readonly OpsLinkManager $links,
        private readonly DbQuery $query,
    ) {
    }

    #[Route('/{id}/query', name: 'query', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('ssh', checkScopes: false)]
    public function query(int $id, Request $request, #[CurrentUser] ?User $user): JsonResponse
    {
        $this->denyAccessUnlessGranted('IS_AUTHENTICATED_FULLY');
        \assert($user instanceof User);
        try {
            $data = $request->toArray();
            $link = $this->links->require($user, 'db', $id);

            return $this->json($this->query->run($link, (string) ($data['sql'] ?? '')));
        } catch (BadRequestHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_BAD_REQUEST);
        } catch (NotFoundHttpException $error) {
            return $this->json(['message' => $error->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (\JsonException) {
            return $this->json(['message' => 'Пустой запрос'], Response::HTTP_BAD_REQUEST);
        }
    }
}
