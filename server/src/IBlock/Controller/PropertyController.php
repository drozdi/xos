<?php

namespace IBlock\Controller;

use AbstractRepository;
use IBlock\Entity\Property;
use IBlock\Repository\PropertyRepository;
use IBlock\Repository\TypeRepository;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/iblock/property', name: 'api_iblock_property_')]
class PropertyController extends IBlockCrudController
{
    public function __construct(
        private readonly PropertyRepository $propertyRepository,
        private readonly TypeRepository $typeRepository,
    ) {
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->propertyRepository;
    }

    protected function getListAlias(): string
    {
        return 'p';
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
        /** @var Property $entity */
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
        /** @var Property $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'required' => $entity->isRequired(),
            'multiple' => $entity->isMultiple(),
            'field_type' => $entity->getFieldType(),
            'list_type' => $entity->getListType(),
            'default_value' => $entity->getDefaultValue(),
            'postfix' => $entity->getPostfix(),
            'prefix' => $entity->getPrefix(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'type_id' => $entity->getType()?->getId(),
            'parent_id' => $entity->getParent()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $data): object
    {
        $property = new Property();
        $this->applyPropertyData($property, $data);

        return $property;
    }

    protected function updateEntity(object $entity, array $data): void
    {
        /** @var Property $entity */
        $this->applyPropertyData($entity, $data);
    }

    protected function serializeRemoved(object $entity): array
    {
        /** @var Property $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
        ];
    }

    private function applyPropertyData(Property $property, array $data): void
    {
        if (array_key_exists('code', $data)) {
            $property->setCode((string) $data['code']);
        }
        if (array_key_exists('name', $data)) {
            $property->setName((string) $data['name']);
        }
        if (array_key_exists('description', $data)) {
            $property->setDescription($data['description']);
        }
        if (array_key_exists('sort', $data)) {
            $property->setSort((int) $data['sort']);
        }
        if (array_key_exists('active', $data)) {
            $property->setActive((bool) $data['active']);
        }
        if (array_key_exists('required', $data)) {
            $property->setRequired((bool) $data['required']);
        }
        if (array_key_exists('multiple', $data)) {
            $property->setMultiple((bool) $data['multiple']);
        }
        if (array_key_exists('field_type', $data)) {
            $property->setFieldType($data['field_type']);
        }
        if (array_key_exists('list_type', $data)) {
            $property->setListType($data['list_type']);
        }
        if (array_key_exists('default_value', $data)) {
            $property->setDefaultValue($data['default_value']);
        }
        if (array_key_exists('postfix', $data)) {
            $property->setPostfix($data['postfix']);
        }
        if (array_key_exists('prefix', $data)) {
            $property->setPrefix($data['prefix']);
        }
        if (array_key_exists('active_from', $data)) {
            $property->setActiveFrom($this->parseDate($data['active_from']));
        }
        if (array_key_exists('active_to', $data)) {
            $property->setActiveTo($this->parseDate($data['active_to']));
        }
        if (array_key_exists('type_id', $data)) {
            $type = null;
            if (null !== $data['type_id'] && '' !== $data['type_id']) {
                $type = $this->typeRepository->find((int) $data['type_id']);
            }
            $property->setType($type);
        }
        if (array_key_exists('parent_id', $data)) {
            $parent = null;
            if (null !== $data['parent_id'] && '' !== $data['parent_id']) {
                $parent = $this->propertyRepository->find((int) $data['parent_id']);
            }
            $property->setParent($parent);
        }
    }
}
