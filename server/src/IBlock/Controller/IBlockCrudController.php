<?php

namespace IBlock\Controller;

use App\Http\ContentRangeHeaders;
use App\Http\ListRequest;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

abstract class IBlockCrudController extends AbstractController
{
    abstract protected function getRepository(): \AbstractRepository;

    abstract protected function serializeListItem(object $entity): array;

    abstract protected function serializeDetail(object $entity): array;

    abstract protected function createEntity(array $data): object;

    abstract protected function updateEntity(object $entity, array $data): void;

    abstract protected function serializeRemoved(object $entity): array;

    protected function getListAlias(): string
    {
        return 'e';
    }

    /** @return array<int, array{key: string, order: string}> */
    protected function getDefaultSort(): array
    {
        return [
            ['key' => 'sort', 'order' => 'ASC'],
            ['key' => 'name', 'order' => 'ASC'],
        ];
    }

    protected function getDefaultFilters(): array
    {
        return [];
    }

    protected function list(Request $request): JsonResponse
    {
        $repository = $this->getRepository();
        $req = ListRequest::merge([
            't' => 'list',
            'limit' => 20,
            'offset' => 1,
            'sortBy' => $this->getDefaultSort(),
            'filters' => $this->getDefaultFilters(),
        ], $request->toArray());
        if (empty($req['sortBy'])) {
            $req['sortBy'] = $this->getDefaultSort();
        }

        $totalItems = $repository->cnt($req['filters']);
        $query = $repository->getQueryBuilder($req['filters'], $req['sortBy'], $req['limit'], $req['offset'], $this->getListAlias());
        $items = [];

        foreach ($query->getQuery()->execute() as $entity) {
            if ('select' === $req['t']) {
                $items[] = [
                    'value' => method_exists($entity, 'getId') ? $entity->getId() : null,
                    'label' => method_exists($entity, 'getName') ? $entity->getName() : '',
                ];
            } else {
                $items[] = $this->serializeListItem($entity);
            }
        }

        return $this->json($items, Response::HTTP_OK, ContentRangeHeaders::forLegacyPagination(
            $req['limit'],
            $req['offset'],
            $totalItems,
        ));
    }

    protected function detail(int $id): JsonResponse
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        return $this->json($this->serializeDetail($entity));
    }

    protected function create(Request $request, ValidatorInterface $validator): JsonResponse
    {
        try {
            $entity = $this->createEntity($request->toArray());
            $this->validate($entity, $validator);
            $this->getRepository()->save($entity, true);
        } catch (ValidationFailedException $e) {
            return $this->violationResponse($e->getViolations());
        }

        return $this->json(method_exists($entity, 'getId') ? $entity->getId() : null, Response::HTTP_CREATED);
    }

    protected function update(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        try {
            $this->updateEntity($entity, $request->toArray());
            $this->validate($entity, $validator);
            $this->getRepository()->save($entity, true);
        } catch (ValidationFailedException $e) {
            return $this->violationResponse($e->getViolations());
        }

        return $this->json(method_exists($entity, 'getId') ? $entity->getId() : null, Response::HTTP_OK);
    }

    protected function remove(int $id): JsonResponse
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            return $this->json(['error' => 'Not found'], Response::HTTP_NOT_FOUND);
        }

        $payload = $this->serializeRemoved($entity);
        $this->getRepository()->remove($entity, true);

        return $this->json($payload, Response::HTTP_OK);
    }

    protected function validate(object $entity, ValidatorInterface $validator): void
    {
        $violations = $validator->validate($entity);
        if (count($violations) > 0) {
            throw new ValidationFailedException($entity, $violations);
        }
    }

    protected function violationResponse(ConstraintViolationListInterface $violations): JsonResponse
    {
        $messages = [];
        foreach ($violations as $violation) {
            $messages[$violation->getPropertyPath()] = $violation->getMessage();
        }

        return $this->json($messages, Response::HTTP_BAD_REQUEST);
    }

    protected function parseDate(mixed $value): ?\DateTimeInterface
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if ($value instanceof \DateTimeInterface) {
            return $value;
        }

        return new \DateTime((string) $value);
    }
}
