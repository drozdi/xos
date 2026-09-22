<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\SectionProperty;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\PropertyRepository;
use IBlock\Repository\SectionPropertyRepository;
use IBlock\Repository\SectionRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class SectionPropertyManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly SectionPropertyRepository $sectionPropertyRepository,
        private readonly SectionRepository $sectionRepository,
        private readonly PropertyRepository $propertyRepository,
        private readonly BlockRepository $blockRepository,
    ) {
        parent::__construct($validator, $entityManager);
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->sectionPropertyRepository;
    }

    protected function getListAlias(): string
    {
        return 'sp';
    }

    /**
     * Active smart-filter properties for section filter UI.
     *
     * @return list<array<string, mixed>>
     */
    public function getFilterSettingsForSection(int $sectionId): array
    {
        $items = $this->sectionPropertyRepository->findFilter(
            [
                'section_id' => $sectionId,
                'smart_filter' => true,
                'active' => true,
            ],
            [
                ['key' => 'sort', 'order' => 'ASC'],
                ['key' => 'id', 'order' => 'ASC'],
            ],
            0,
            1,
            'sp',
        );

        $result = [];
        foreach ($items as $entity) {
            /** @var SectionProperty $entity */
            $property = $entity->getProperty();
            if (!$property) {
                continue;
            }
            $result[] = [
                'id' => $entity->getId(),
                'property_id' => $property->getId(),
                'code' => $property->getCode(),
                'name' => $property->getName(),
                'field_type' => $property->getFieldType(),
                'display_type' => $entity->getDisplayType(),
                'display_expanded' => $entity->isDisplayExpanded(),
                'sort' => $entity->getSort(),
            ];
        }

        return $result;
    }

    protected function serializeListItem(object $entity): array
    {
        /** @var SectionProperty $entity */
        return [
            'id' => $entity->getId(),
            'section_id' => $entity->getSection()?->getId(),
            'property_id' => $entity->getProperty()?->getId(),
            'block_id' => $entity->getBlock()?->getId(),
            'smart_filter' => $entity->isSmartFilter(),
            'display_type' => $entity->getDisplayType(),
            'display_expanded' => $entity->isDisplayExpanded(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var SectionProperty $entity */
        return [
            'id' => $entity->getId(),
            'section_id' => $entity->getSection()?->getId(),
            'property_id' => $entity->getProperty()?->getId(),
            'block_id' => $entity->getBlock()?->getId(),
            'smart_filter' => $entity->isSmartFilter(),
            'display_type' => $entity->getDisplayType(),
            'display_expanded' => $entity->isDisplayExpanded(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'property_code' => $entity->getProperty()?->getCode(),
            'property_name' => $entity->getProperty()?->getName(),
            'field_type' => $entity->getProperty()?->getFieldType(),
        ];
    }

    protected function createEntity(array $fields): object
    {
        $entity = new SectionProperty();
        $this->applyFields($entity, $fields);

        return $entity;
    }

    protected function applyFields(object $entity, array $fields): void
    {
        /** @var SectionProperty $entity */
        if (array_key_exists('section_id', $fields)) {
            $sectionId = $this->requireRelationId($fields['section_id'], 'section_id');
            $section = $this->sectionRepository->find($sectionId);
            if (!$section) {
                throw new BadRequestHttpException('section_id not found');
            }
            $entity->setSection($section);
        }
        if (array_key_exists('property_id', $fields)) {
            $propertyId = $this->requireRelationId($fields['property_id'], 'property_id');
            $property = $this->propertyRepository->find($propertyId);
            if (!$property) {
                throw new BadRequestHttpException('property_id not found');
            }
            $entity->setProperty($property);
        }
        if (array_key_exists('block_id', $fields)) {
            $block = null;
            if (null !== $fields['block_id'] && '' !== $fields['block_id']) {
                $block = $this->blockRepository->find((int) $fields['block_id']);
            }
            $entity->setBlock($block);
        }
        if (array_key_exists('smart_filter', $fields)) {
            $entity->setSmartFilter((bool) $fields['smart_filter']);
        }
        if (array_key_exists('display_type', $fields)) {
            $entity->setDisplayType((string) $fields['display_type']);
        }
        if (array_key_exists('display_expanded', $fields)) {
            $entity->setDisplayExpanded((bool) $fields['display_expanded']);
        }
        if (array_key_exists('sort', $fields)) {
            $entity->setSort((int) $fields['sort']);
        }
        if (array_key_exists('active', $fields)) {
            $entity->setActive((bool) $fields['active']);
        }

        if (null === $entity->getBlock() && $entity->getSection()?->getBlock()) {
            $entity->setBlock($entity->getSection()->getBlock());
        }
    }

    /** @param array<string, mixed> $fields */
    public function add(array $fields): int
    {
        if (!array_key_exists('section_id', $fields)) {
            throw new BadRequestHttpException('section_id is required');
        }
        if (!array_key_exists('property_id', $fields)) {
            throw new BadRequestHttpException('property_id is required');
        }

        return parent::add($fields);
    }
}
