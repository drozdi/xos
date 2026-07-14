<?php

namespace IBlock\Controller;

use AbstractRepository;
use IBlock\Entity\Type;
use IBlock\Repository\TypeRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/iblock/type', name: 'api_iblock_type_')]
class TypeController extends IBlockCrudController
{
    public function __construct(
        private readonly TypeRepository $typeRepository,
    ) {
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->typeRepository;
    }

    protected function getListAlias(): string
    {
        return 't';
    }

    #[Route('/list', name: 'list', methods: ['POST'])]
    public function listAction(Request $request): JsonResponse
    {
        return $this->list($request);
    }

    #[Route('/{id}', name: 'detail', methods: ['GET', 'HEAD'], requirements: ['id' => '\d+'])]
    public function detailAction(int $id): JsonResponse
    {
        return $this->detail($id);
    }

    #[Route('/', name: 'create', methods: ['POST'])]
    public function createAction(Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->create($request, $validator);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function updateAction(int $id, Request $request, ValidatorInterface $validator): JsonResponse
    {
        return $this->update($id, $request, $validator);
    }

    #[Route('/{id}', name: 'remove', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function removeAction(int $id): JsonResponse
    {
        return $this->remove($id);
    }

    protected function serializeListItem(object $entity): array
    {
        /** @var Type $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var Type $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'sections' => $entity->isSections(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'parent_id' => $entity->getParent()?->getId(),
            'property_id' => $entity->getProperty()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $data): object
    {
        $type = new Type();
        $this->applyTypeData($type, $data);

        return $type;
    }

    protected function updateEntity(object $entity, array $data): void
    {
        /** @var Type $entity */
        $this->applyTypeData($entity, $data);
    }

    protected function serializeRemoved(object $entity): array
    {
        /** @var Type $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
        ];
    }

    private function applyTypeData(Type $type, array $data): void
    {
        if (array_key_exists('code', $data)) {
            $type->setCode((string) $data['code']);
        }
        if (array_key_exists('name', $data)) {
            $type->setName((string) $data['name']);
        }
        if (array_key_exists('description', $data)) {
            $type->setDescription($data['description']);
        }
        if (array_key_exists('sort', $data)) {
            $type->setSort((int) $data['sort']);
        }
        if (array_key_exists('active', $data)) {
            $type->setActive((bool) $data['active']);
        }
        if (array_key_exists('sections', $data)) {
            $type->setSections((bool) $data['sections']);
        }
        if (array_key_exists('active_from', $data)) {
            $type->setActiveFrom($this->parseDate($data['active_from']));
        }
        if (array_key_exists('active_to', $data)) {
            $type->setActiveTo($this->parseDate($data['active_to']));
        }
        if (array_key_exists('parent_id', $data)) {
            $parent = null;
            if (null !== $data['parent_id'] && '' !== $data['parent_id']) {
                $parent = $this->typeRepository->find((int) $data['parent_id']);
            }
            $type->setParent($parent);
        }
    }
}
