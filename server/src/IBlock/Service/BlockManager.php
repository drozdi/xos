<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Block;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\TypeRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class BlockManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly BlockRepository $blockRepository,
        private readonly TypeRepository $typeRepository,
    ) {
        parent::__construct($validator, $entityManager);
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->blockRepository;
    }

    protected function getListAlias(): string
    {
        return 'b';
    }

    protected function serializeListItem(object $entity): array
    {
        /** @var Block $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'type_id' => $entity->getType()?->getId(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var Block $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'sections' => $entity->isSections(),
            'property' => $entity->isProperty(),
            'section_mode' => $entity->getSectionMode(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'type_id' => $entity->getType()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $fields): object
    {
        $block = new Block();
        $this->applyFields($block, $fields);

        return $block;
    }

    protected function applyFields(object $entity, array $fields): void
    {
        /** @var Block $entity */
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
        if (array_key_exists('property', $fields)) {
            $entity->setProperty((bool) $fields['property']);
        }
        if (array_key_exists('section_mode', $fields) && null !== $fields['section_mode'] && '' !== $fields['section_mode']) {
            $entity->setSectionMode((string) $fields['section_mode']);
        }
        if (array_key_exists('active_from', $fields)) {
            $entity->setActiveFrom($this->parseDate($fields['active_from']));
        }
        if (array_key_exists('active_to', $fields)) {
            $entity->setActiveTo($this->parseDate($fields['active_to']));
        }
        if (array_key_exists('type_id', $fields)) {
            $type = null;
            if (null !== $fields['type_id'] && '' !== $fields['type_id']) {
                $type = $this->typeRepository->find((int) $fields['type_id']);
            }
            $entity->setType($type);
        }
    }
}
