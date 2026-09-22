<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

abstract class AbstractIBlockManager
{
    public function __construct(
        protected readonly ValidatorInterface $validator,
        protected readonly EntityManagerInterface $entityManager,
    ) {
    }

    abstract protected function getRepository(): AbstractRepository;

    abstract protected function getListAlias(): string;

    /** @param object $entity */
    abstract protected function serializeListItem(object $entity): array;

    /** @param object $entity */
    abstract protected function serializeDetail(object $entity): array;

    /** @return object */
    abstract protected function createEntity(array $fields): object;

    /** @param object $entity */
    abstract protected function applyFields(object $entity, array $fields): void;

    public function getById(int $id): ?array
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            return null;
        }

        return $this->serializeDetail($entity);
    }

    /**
     * @param array<int, array{key?: string, order?: string}>|array<string, string> $order
     * @param array<string, mixed>                                                  $filter
     *
     * @return list<array<string, mixed>>
     */
    public function getList(array $order, array $filter, ?int $limit = null, ?int $offset = null): array
    {
        $entities = $this->getRepository()->findFilter(
            $filter,
            $this->normalizeOrder($order),
            null === $limit ? 0 : $limit,
            null === $offset ? 1 : $offset,
            $this->getListAlias(),
        );

        $items = [];
        foreach ($entities as $entity) {
            $items[] = $this->serializeListItem($entity);
        }

        return $items;
    }

    /** @param array<string, mixed> $filter */
    public function count(array $filter): int
    {
        return $this->getRepository()->cnt($filter);
    }

    /** @param array<string, mixed> $fields */
    public function add(array $fields): int
    {
        $entity = $this->createEntity($fields);
        $this->validateEntity($entity);
        $this->persistEntity($entity, true);

        return (int) $entity->getId();
    }

    /** @param array<string, mixed> $fields */
    public function update(int $id, array $fields): void
    {
        $entity = $this->requireEntity($id);
        $this->applyFields($entity, $fields);
        $this->validateEntity($entity);
        $this->persistEntity($entity, true);
    }

    public function delete(int $id): void
    {
        $entity = $this->requireEntity($id);
        $this->getRepository()->remove($entity, true);
    }

    protected function requireEntity(int $id): object
    {
        $entity = $this->getRepository()->find($id);
        if (!$entity) {
            throw new NotFoundHttpException('Not found');
        }

        return $entity;
    }

    protected function validateEntity(object $entity): void
    {
        $violations = $this->validator->validate($entity);
        if (count($violations) > 0) {
            throw new ValidationFailedException($entity, $violations);
        }
    }

    protected function persistEntity(object $entity, bool $flush = false): void
    {
        $repo = $this->getRepository();
        if (method_exists($repo, 'save')) {
            $repo->save($entity, $flush);

            return;
        }

        if (!(int) (method_exists($entity, 'getId') ? $entity->getId() : 0)) {
            $this->entityManager->persist($entity);
        }
        if ($flush) {
            $this->entityManager->flush();
        }
    }

    /**
     * @param array<int, array{key?: string, order?: string}>|array<string, string> $order
     *
     * @return list<array{key: string, order: string}>
     */
    protected function normalizeOrder(array $order): array
    {
        if ([] === $order) {
            return [
                ['key' => 'sort', 'order' => 'ASC'],
                ['key' => 'name', 'order' => 'ASC'],
            ];
        }

        $normalized = [];
        $isList = array_is_list($order);
        foreach ($order as $key => $value) {
            if ($isList && is_array($value)) {
                $normalized[] = [
                    'key' => (string) ($value['key'] ?? 'id'),
                    'order' => (string) ($value['order'] ?? 'ASC'),
                ];
                continue;
            }
            $normalized[] = [
                'key' => (string) $key,
                'order' => (string) $value,
            ];
        }

        return $normalized;
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

    protected function requireRelationId(mixed $value, string $field): int
    {
        if (null === $value || '' === $value) {
            throw new BadRequestHttpException(sprintf('%s is required', $field));
        }

        return (int) $value;
    }
}
