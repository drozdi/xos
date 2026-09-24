<?php

namespace IBlock\Controller;

use App\Attribute\Access;
use App\Http\ContentRangeHeaders;
use IBlock\Service\ElementManager;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;

#[Route('/api/iblock/element', name: 'api_iblock_element_')]
#[Access('iblock.element')]
class ElementController extends AbstractController
{
    public function __construct(
        private readonly ElementManager $elementManager,
    ) {
    }

    #[Route('/list', name: 'list', methods: ['POST'])]
    #[Access('can_read')]
    public function listAction(Request $request): JsonResponse
    {
        $req = array_merge([
            't' => 'list',
            'limit' => -1,
            'offset' => 1,
            'sortBy' => [
                ['key' => 'sort', 'order' => 'ASC'],
                ['key' => 'name', 'order' => 'ASC'],
            ],
            'filters' => [],
        ], $request->toArray());
        $limit = (int) $req['limit'];
        $offset = (int) $req['offset'];
        $filters = is_array($req['filters'] ?? null) ? $req['filters'] : [];
        $sortBy = is_array($req['sortBy'] ?? null) ? $req['sortBy'] : [];

        $totalItems = $this->elementManager->count($filters);
        $items = $this->elementManager->getList($sortBy, $filters, $limit, $offset);

        if ('select' === ($req['t'] ?? 'list')) {
            $items = array_map(static fn (array $row): array => [
                'value' => $row['id'] ?? null,
                'label' => $row['name'] ?? '',
            ], $items);
        }

        return $this->json($items, Response::HTTP_OK, ContentRangeHeaders::forLegacyPagination(
            $limit,
            $offset,
            $totalItems,
        ));
    }

    #[Route('/{id}/share', name: 'share', methods: ['POST'], requirements: ['id' => '\d+'])]
    #[Access('can_update')]
    public function shareAction(int $id, Request $request): JsonResponse
    {
        $body = $request->toArray();
        $email = (string) ($body['email'] ?? '');
        try {
            return $this->json($this->elementManager->shareElement($id, $email));
        } catch (AccessDeniedHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (NotFoundHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_NOT_FOUND);
        } catch (BadRequestHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_BAD_REQUEST);
        }
    }

    #[Route('/{id}/share/{userId}', name: 'unshare', methods: ['DELETE'], requirements: ['id' => '\d+', 'userId' => '\d+'])]
    #[Access('can_update')]
    public function unshareAction(int $id, int $userId): JsonResponse
    {
        try {
            return $this->json($this->elementManager->unshareElement($id, $userId));
        } catch (AccessDeniedHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (NotFoundHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_NOT_FOUND);
        }
    }

    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'], requirements: ['id' => '\d+'])]
    #[Access('can_read')]
    public function detailAction(int $id): JsonResponse
    {
        try {
            $payload = $this->elementManager->getById($id);
        } catch (AccessDeniedHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        }
        if (null === $payload) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($payload);
    }

    #[Route('/', name: 'create', methods: ['POST'])]
    #[Access('can_create')]
    public function createAction(Request $request): JsonResponse
    {
        try {
            $id = $this->elementManager->add($request->toArray());
        } catch (ValidationFailedException $e) {
            return $this->violationResponse($e->getViolations());
        }

        return $this->json($id, Response::HTTP_CREATED);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    #[Access('can_update')]
    public function updateAction(int $id, Request $request): JsonResponse
    {
        try {
            $this->elementManager->update($id, $request->toArray());
        } catch (AccessDeniedHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (NotFoundHttpException) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        } catch (ValidationFailedException $e) {
            return $this->violationResponse($e->getViolations());
        }

        return $this->json($id, Response::HTTP_OK);
    }

    #[Route('/{id}', name: 'remove', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    #[Access('can_delete')]
    public function removeAction(int $id): JsonResponse
    {
        try {
            $payload = $this->elementManager->getById($id);
        } catch (AccessDeniedHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        }
        if (null === $payload) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        try {
            $this->elementManager->delete($id);
        } catch (AccessDeniedHttpException $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_FORBIDDEN);
        } catch (NotFoundHttpException) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $payload['id'] ?? $id,
            'code' => $payload['code'] ?? null,
            'name' => $payload['name'] ?? null,
        ], Response::HTTP_OK);
    }

    private function violationResponse(ConstraintViolationListInterface $violations): JsonResponse
    {
        $messages = [];
        foreach ($violations as $violation) {
            $messages[$violation->getPropertyPath()] = $violation->getMessage();
        }

        return $this->json($messages, Response::HTTP_BAD_REQUEST);
    }
}
