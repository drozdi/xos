<?php

namespace Assets\Controller;

use AbstractRepository;
use App\Http\ApiResponse;
use App\Http\ContentRangeHeaders;
use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\OU;
use Main\Entity\User;
use Main\Service\OuScope;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\ConstraintViolationListInterface;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

abstract class AssetsCrudController extends AbstractController
{
    abstract protected function getRepository(): AbstractRepository;

    /** @param object $entity */
    abstract protected function serializeListItem(object $entity): array;

    /** @param object $entity */
    abstract protected function serializeDetail(object $entity): array;

    /** @return object */
    abstract protected function createEntity(array $data): object;

    /** @param object $entity */
    abstract protected function updateEntity(object $entity, array $data): void;

    /** @param object $entity */
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

    /**
     * @param array<string, mixed> $filters
     *
     * @return array<string, mixed>
     */
    protected function normalizeOuFilters(array $filters): array
    {
        $ouId = null;
        if (isset($filters['ou']) && (is_int($filters['ou']) || is_numeric($filters['ou'])) && (int) $filters['ou'] > 0) {
            $ouId = (int) $filters['ou'];
        } elseif (isset($filters['ou_id']) && (is_int($filters['ou_id']) || is_numeric($filters['ou_id'])) && (int) $filters['ou_id'] > 0) {
            $ouId = (int) $filters['ou_id'];
        }
        unset($filters['ou'], $filters['ou_id']);
        if (null !== $ouId) {
            $filters['ou'] = $ouId;
        }

        return $filters;
    }

    protected function assignOu(object $entity, array $data, EntityManagerInterface $em): void
    {
        if (!method_exists($entity, 'setOu')) {
            return;
        }

        $raw = $data['ou_id'] ?? $data['ou'] ?? null;
        if (null === $raw || '' === $raw || (int) $raw <= 0) {
            $entity->setOu(null);

            return;
        }

        $ou = $em->find(OU::class, (int) $raw);
        $entity->setOu($ou);
    }

    protected function listAction(Request $request, OuScope $ouScope, #[CurrentUser] User $user): JsonResponse
    {
        $repository = $this->getRepository();
        $req = array_merge([
            't' => 'list',
            'limit' => -1,
            'offset' => 1,
            'sortBy' => $this->getDefaultSort(),
            'filters' => [],
        ], $request->toArray());
        $req['limit'] = (int) $req['limit'];
        $req['offset'] = (int) $req['offset'];
        $filters = \is_array($req['filters'] ?? null) ? $req['filters'] : [];
        $filters = $this->normalizeOuFilters($ouScope->applyListFilter($user, $filters));
        $sortBy = \is_array($req['sortBy'] ?? null) ? $req['sortBy'] : $this->getDefaultSort();

        $totalItems = $repository->cnt($filters);
        $entities = $repository->findFilter($filters, $sortBy, $req['limit'], $req['offset'], $this->getListAlias());
        $items = [];

        foreach ($entities as $entity) {
            if ('select' === ($req['t'] ?? 'list')) {
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

    protected function detailAction(int $id): JsonResponse
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            return ApiResponse::notFound('Not found');
        }

        return $this->json($this->serializeDetail($entity));
    }

    protected function createAction(
        Request $request,
        ValidatorInterface $validator,
        OuScope $ouScope,
        EntityManagerInterface $em,
        #[CurrentUser] User $user,
    ): JsonResponse {
        try {
            $data = $ouScope->applyCreateDefaults($user, $request->toArray());
            $entity = $this->createEntity($data);
            $this->assignOu($entity, $data, $em);
            $this->validate($entity, $validator);
            $this->getRepository()->save($entity, true);
        } catch (ValidationFailedException $e) {
            return $this->violationResponse($e->getViolations());
        }

        return $this->json(method_exists($entity, 'getId') ? $entity->getId() : null, Response::HTTP_CREATED);
    }

    protected function updateAction(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            return ApiResponse::notFound('Not found');
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

    protected function removeAction(int $id): JsonResponse
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            return ApiResponse::notFound('Not found');
        }

        $payload = $this->serializeRemoved($entity);
        $this->getRepository()->remove($entity, true);

        return $this->json($payload, Response::HTTP_OK);
    }

    protected function validate(object $entity, ValidatorInterface $validator): void
    {
        $violations = $validator->validate($entity);
        if (\count($violations) > 0) {
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

    protected function formatDate(?\DateTimeInterface $value): ?string
    {
        return $value?->format('Y-m-d H:i:s');
    }

    protected function nullableString(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }
        $str = trim((string) $value);

        return '' === $str ? null : $str;
    }

    protected function decimalString(mixed $value, string $default = '0'): string
    {
        if (null === $value || '' === $value) {
            return $default;
        }

        return (string) $value;
    }

    protected function nullableDecimal(mixed $value): ?string
    {
        if (null === $value || '' === $value) {
            return null;
        }

        return (string) $value;
    }

    protected function nullableInt(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }

        return (int) $value;
    }
}
