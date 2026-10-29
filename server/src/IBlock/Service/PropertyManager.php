<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Property;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\PropertyRepository;
use IBlock\Security\RecipesBlockGuard;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Main\Entity\User;

class PropertyManager extends AbstractIBlockManager
{
    private const ALLOWED_FIELD_TYPES = ['S', 'N', 'F', 'L', 'E', 'G', 'P'];

    private const MEMBER_FIELD_TYPES = ['S', 'N', 'F', 'L', 'E', 'G'];

    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly PropertyRepository $propertyRepository,
        private readonly BlockRepository $blockRepository,
        private readonly RecipesBlockGuard $recipesBlockGuard,
        private readonly Security $security,
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
            'file_type' => $entity->getFileType(),
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
            'file_type' => $entity->getFileType(),
            'list_type' => $entity->getListType(),
            'default_value' => $entity->getDefaultValue(),
            'postfix' => $entity->getPostfix(),
            'prefix' => $entity->getPrefix(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'block_id' => $entity->getBlock()?->getId(),
            'link_iblock_id' => $entity->getLinkIblock()?->getId(),
            'parent_id' => $entity->getParent()?->getId(),
            'children' => $this->serializeChildren($entity),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function serializeChildren(Property $entity): array
    {
        if ('P' !== strtoupper($entity->getFieldType())) {
            return [];
        }

        $children = $entity->getChildren()->toArray();
        usort($children, static function (Property $a, Property $b): int {
            return [$a->getSort(), (string) $a->getCode()] <=> [$b->getSort(), (string) $b->getCode()];
        });

        $items = [];
        foreach ($children as $child) {
            $items[] = [
                'id' => $child->getId(),
                'code' => $child->getCode(),
                'name' => $child->getName(),
                'sort' => $child->getSort(),
                'active' => $child->isActive(),
                'multiple' => $child->isMultiple(),
                'field_type' => strtoupper($child->getFieldType()),
                'file_type' => $child->getFileType(),
                'list_type' => $child->getListType(),
                'link_iblock_id' => $child->getLinkIblock()?->getId(),
                'block_id' => $child->getBlock()?->getId(),
                'parent_id' => $entity->getId(),
            ];
        }

        return $items;
    }

    public function getById(int $id): ?array
    {
        $entity = $this->propertyRepository->find($id);
        if (!$entity instanceof Property) {
            return null;
        }
        $this->recipesBlockGuard->assertPropertyAllowed($this->currentUser(), $entity);

        return $this->serializeDetail($entity);
    }

    public function getList(array $order, array $filter, ?int $limit = null, ?int $offset = null): array
    {
        $filter = $this->recipesBlockGuard->constrainListFilter($filter, $this->currentUser());

        return parent::getList($order, $filter, $limit, $offset);
    }

    public function count(array $filter): int
    {
        $filter = $this->recipesBlockGuard->constrainListFilter($filter, $this->currentUser());

        return parent::count($filter);
    }

    public function add(array $fields): int
    {
        $user = $this->currentUser();
        if (isset($fields['block_id'])) {
            $this->recipesBlockGuard->assertBlockIdAllowed($user, (int) $fields['block_id']);
        } elseif ($this->recipesBlockGuard->isRecipeOnlyUser($user)) {
            $blockId = $this->recipesBlockGuard->recipesBlockId();
            if (null === $blockId) {
                throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException('Блок recipes не найден');
            }
            $fields['block_id'] = $blockId;
        }

        $entity = $this->createEntity($fields);
        $this->validateEntity($entity);
        $this->persistEntity($entity, true);

        return (int) $entity->getId();
    }

    public function update(int $id, array $fields): void
    {
        /** @var Property $property */
        $property = $this->requireEntity($id);
        $this->recipesBlockGuard->assertPropertyAllowed($this->currentUser(), $property);
        $this->applyFields($property, $fields);
        $this->assertPropertyConfig($property);
        $this->validateEntity($property);
        $this->persistEntity($property, true);
    }

    public function delete(int $id): void
    {
        /** @var Property $property */
        $property = $this->requireEntity($id);
        $this->recipesBlockGuard->assertPropertyAllowed($this->currentUser(), $property);
        parent::delete($id);
    }

    private function currentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
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
        if (array_key_exists('file_type', $fields)) {
            $raw = $fields['file_type'];
            $entity->setFileType(null === $raw || '' === $raw ? null : (string) $raw);
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
                if (!$parent instanceof Property) {
                    throw new BadRequestHttpException('parent_id not found');
                }
            }
            $entity->setParent($parent);
        }
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

        $parent = $property->getParent();
        if ('P' === $fieldType && null !== $parent) {
            throw new BadRequestHttpException('prototype cannot be nested');
        }
        if (null !== $parent) {
            if ('P' !== strtoupper($parent->getFieldType())) {
                throw new BadRequestHttpException('parent must be a prototype property');
            }
            if ($parent->getBlock()?->getId() !== $property->getBlock()?->getId()) {
                throw new BadRequestHttpException('prototype field must belong to the same block');
            }
            if (!\in_array($fieldType, self::MEMBER_FIELD_TYPES, true)) {
                throw new BadRequestHttpException('prototype field type must be one of: S, N, F, L, E, G');
            }
        }
        if ('P' !== $fieldType && $property->getChildren()->count() > 0) {
            throw new BadRequestHttpException('remove prototype fields before changing field_type');
        }
    }
}
