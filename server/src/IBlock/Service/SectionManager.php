<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Section;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\SectionRepository;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class SectionManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly SectionRepository $sectionRepository,
        private readonly BlockRepository $blockRepository,
        private readonly SectionElementManager $sectionElementManager,
    ) {
        parent::__construct($validator, $entityManager);
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->sectionRepository;
    }

    protected function getListAlias(): string
    {
        return 's';
    }

    protected function serializeListItem(object $entity): array
    {
        /** @var Section $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'level' => $entity->getLevel(),
            'block_id' => $entity->getBlock()?->getId(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var Section $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'sort' => $entity->getSort(),
            'level' => $entity->getLevel(),
            'active' => $entity->isActive(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'block_id' => $entity->getBlock()?->getId(),
            'parent_id' => $entity->getParent()?->getId(),
            'element_filter' => $entity->getElementFilter(),
            'inherited_element_filter' => $this->sectionElementManager->resolveInheritedFilter($entity),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    protected function createEntity(array $fields): object
    {
        $section = new Section();
        $this->applyFields($section, $fields);

        return $section;
    }

    protected function applyFields(object $entity, array $fields): void
    {
        /** @var Section $entity */
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
        if (array_key_exists('level', $fields)) {
            $entity->setLevel((int) $fields['level']);
        }
        if (array_key_exists('active', $fields)) {
            $entity->setActive((bool) $fields['active']);
        }
        if (array_key_exists('active_from', $fields)) {
            $entity->setActiveFrom($this->parseDate($fields['active_from']));
        }
        if (array_key_exists('active_to', $fields)) {
            $entity->setActiveTo($this->parseDate($fields['active_to']));
        }
        if (array_key_exists('element_filter', $fields)) {
            $filter = $fields['element_filter'];
            if (null === $filter || '' === $filter) {
                $entity->setElementFilter(null);
            } elseif (\is_array($filter)) {
                $entity->setElementFilter($filter);
            }
        }
        if (array_key_exists('block_id', $fields)) {
            $block = null;
            if (null !== $fields['block_id'] && '' !== $fields['block_id']) {
                $block = $this->blockRepository->find((int) $fields['block_id']);
            }
            $entity->setBlock($block);
        }
        if (array_key_exists('parent_id', $fields)) {
            $parent = null;
            if (null !== $fields['parent_id'] && '' !== $fields['parent_id']) {
                $parent = $this->sectionRepository->find((int) $fields['parent_id']);
            }
            $entity->setParent($parent);
        }
    }
}
