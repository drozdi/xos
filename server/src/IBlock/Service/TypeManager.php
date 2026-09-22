<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Type;
use IBlock\Repository\TypeRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class TypeManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly TypeRepository $typeRepository,
    ) {
        parent::__construct($validator, $entityManager);
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->typeRepository;
    }

    protected function getListAlias(): string
    {
        return 't';
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
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $fields): object
    {
        $type = new Type();
        $this->applyFields($type, $fields);

        return $type;
    }

    protected function applyFields(object $entity, array $fields): void
    {
        /** @var Type $entity */
        if (array_key_exists('code', $fields)) {
            $entity->setCode((string) $fields['code']);
        }
        if (array_key_exists('name', $fields)) {
            $entity->setName((string) $fields['name']);
        }
        if (array_key_exists('description', $fields)) {
            $entity->setDescription($fields['description']);
        }
        if (array_key_exists('sort', $fields)) {
            $entity->setSort((int) $fields['sort']);
        }
        if (array_key_exists('active', $fields)) {
            $entity->setActive((bool) $fields['active']);
        }
        if (array_key_exists('sections', $fields)) {
            $entity->setSections((bool) $fields['sections']);
        }
        if (array_key_exists('active_from', $fields)) {
            $entity->setActiveFrom($this->parseDate($fields['active_from']));
        }
        if (array_key_exists('active_to', $fields)) {
            $entity->setActiveTo($this->parseDate($fields['active_to']));
        }
        if (array_key_exists('parent_id', $fields)) {
            $parent = null;
            if (null !== $fields['parent_id'] && '' !== $fields['parent_id']) {
                $parent = $this->typeRepository->find((int) $fields['parent_id']);
            }
            $entity->setParent($parent);
        }
    }
}
