<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Property;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\PropertyRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class PropertyManager extends AbstractIBlockManager
{
    private const ALLOWED_FIELD_TYPES = ['S', 'N', 'F', 'L', 'E', 'G'];

    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly PropertyRepository $propertyRepository,
        private readonly BlockRepository $blockRepository,
    ) {
        parent::__construct($validator, $entityManager);
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->propertyRepository;
    }

    protected function getListAlias(): string
    {
        return 'p';
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
            'block_id' => $entity->getBlock()?->getId(),
            'field_type' => strtoupper($entity->getFieldType()),
            'link_iblock_id' => $entity->getLinkIblock()?->getId(),
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
            'field_type' => strtoupper($entity->getFieldType()),
            'list_type' => $entity->getListType(),
            'default_value' => $entity->getDefaultValue(),
            'postfix' => $entity->getPostfix(),
            'prefix' => $entity->getPrefix(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'block_id' => $entity->getBlock()?->getId(),
            'link_iblock_id' => $entity->getLinkIblock()?->getId(),
            'parent_id' => $entity->getParent()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $fields): object
    {
        $property = new Property();
        $this->applyFields($property, $fields);
        $this->assertPropertyConfig($property);

        return $property;
    }

    protected function applyFields(object $entity, array $fields): void
    {
        /** @var Property $entity */
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
        if (array_key_exists('required', $fields)) {
            $entity->setRequired((bool) $fields['required']);
        }
        if (array_key_exists('multiple', $fields)) {
            $entity->setMultiple((bool) $fields['multiple']);
        }
        if (array_key_exists('field_type', $fields)) {
            $entity->setFieldType($fields['field_type']);
        }
        if (array_key_exists('list_type', $fields)) {
            $entity->setListType($fields['list_type']);
        }
        if (array_key_exists('default_value', $fields)) {
            $entity->setDefaultValue($fields['default_value']);
        }
        if (array_key_exists('postfix', $fields)) {
            $entity->setPostfix($fields['postfix']);
        }
        if (array_key_exists('prefix', $fields)) {
            $entity->setPrefix($fields['prefix']);
        }
        if (array_key_exists('active_from', $fields)) {
            $entity->setActiveFrom($this->parseDate($fields['active_from']));
        }
        if (array_key_exists('active_to', $fields)) {
            $entity->setActiveTo($this->parseDate($fields['active_to']));
        }
        if (array_key_exists('block_id', $fields)) {
            $block = null;
            if (null !== $fields['block_id'] && '' !== $fields['block_id']) {
                $block = $this->blockRepository->find((int) $fields['block_id']);
                if (!$block) {
                    throw new BadRequestHttpException('block_id not found');
                }
            }
            $entity->setBlock($block);
        }
        if (array_key_exists('link_iblock_id', $fields)) {
            $link = null;
            if (null !== $fields['link_iblock_id'] && '' !== $fields['link_iblock_id']) {
                $link = $this->blockRepository->find((int) $fields['link_iblock_id']);
                if (!$link) {
                    throw new BadRequestHttpException('link_iblock_id not found');
                }
            }
            $entity->setLinkIblock($link);
        }
        if (array_key_exists('parent_id', $fields)) {
            $parent = null;
            if (null !== $fields['parent_id'] && '' !== $fields['parent_id']) {
                $parent = $this->propertyRepository->find((int) $fields['parent_id']);
            }
            $entity->setParent($parent);
        }
    }

    public function add(array $fields): int
    {
        $entity = $this->createEntity($fields);
        $this->validateEntity($entity);
        $this->persistEntity($entity, true);

        return (int) $entity->getId();
    }

    public function update(int $id, array $fields): void
    {
        /** @var Property $entity */
        $entity = $this->requireEntity($id);
        $this->applyFields($entity, $fields);
        $this->assertPropertyConfig($entity);
        $this->validateEntity($entity);
        $this->persistEntity($entity, true);
    }

    private function assertPropertyConfig(Property $property): void
    {
        if (!$property->getBlock()) {
            throw new BadRequestHttpException('block_id is required');
        }

        $fieldType = strtoupper($property->getFieldType());
        if (!\in_array($fieldType, self::ALLOWED_FIELD_TYPES, true)) {
            throw new BadRequestHttpException(sprintf(
                'field_type must be one of: %s',
                implode(', ', self::ALLOWED_FIELD_TYPES),
            ));
        }

        if (\in_array($fieldType, ['E', 'G'], true) && !$property->getLinkIblock()) {
            throw new BadRequestHttpException('link_iblock_id is required for field_type E/G');
        }
    }
}
