<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\QueryBuilder;
use IBlock\Entity\Element;
use IBlock\Entity\ElementPropertyValue;
use IBlock\Entity\ElementShare;
use IBlock\Entity\Property;
use IBlock\Entity\Property\Enum as PropertyEnum;
use IBlock\Entity\Section;
use IBlock\Entity\SectionElement;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\ElementRepository;
use IBlock\Repository\PropertyEnumRepository;
use IBlock\Repository\PropertyRepository;
use IBlock\Repository\SectionRepository;
use IBlock\Security\RecipesBlockGuard;
use Main\Entity\File as MainFile;
use Main\Entity\User;
use Main\Repository\UserRepository;
use App\Security\RecipeIblockBridge;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ElementManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly ElementRepository $elementRepository,
        private readonly BlockRepository $blockRepository,
        private readonly SectionRepository $sectionRepository,
        private readonly PropertyRepository $propertyRepository,
        private readonly PropertyEnumRepository $propertyEnumRepository,
        private readonly SectionElementManager $sectionElementManager,
        private readonly Security $security,
        private readonly UserRepository $userRepository,
        private readonly RecipesBlockGuard $recipesBlockGuard,
        private readonly RecipeIblockBridge $recipeIblockBridge,
    ) {
        parent::__construct($validator, $entityManager);
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->elementRepository;
    }

    protected function getListAlias(): string
    {
        return 'e';
    }

    public function getById(int $id): ?array
    {
        $entity = $this->elementRepository->find($id);
        if (!$entity instanceof Element) {
            return null;
        }
        $viewer = $this->currentUser();
        $this->recipesBlockGuard->assertElementAllowed($viewer, $entity);
        if ($viewer instanceof User && !$this->canRead($entity, $viewer)) {
            throw new AccessDeniedHttpException('Нет доступа к элементу');
        }

        return $this->serializeDetail($entity, $viewer);
    }

    /**
     * @param array<int, array{key?: string, order?: string}>|array<string, string> $order
     * @param array<string, mixed>                                                  $filter
     *
     * @return list<array<string, mixed>>
     */
    public function getList(array $order, array $filter, ?int $limit = null, ?int $offset = null): array
    {
        $viewer = $this->currentUser();
        $filter = $this->recipesBlockGuard->constrainListFilter($filter, $viewer);
        $qb = $this->buildFilteredQuery($filter, $order, $limit, $offset);

        $items = [];
        foreach ($qb->getQuery()->execute() as $entity) {
            $items[] = $this->serializeListItem($entity, $viewer);
        }

        return $items;
    }

    /** @param array<string, mixed> $filter */
    public function count(array $filter): int
    {
        $viewer = $this->currentUser();
        $filter = $this->recipesBlockGuard->constrainListFilter($filter, $viewer);
        $qb = $this->buildFilteredQuery($filter);
        $qb->select($qb->expr()->countDistinct('e.id'));

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /** @param array<string, mixed> $fields */
    public function add(array $fields): int
    {
        $viewer = $this->currentUser();
        if (isset($fields['block_id'])) {
            $this->recipesBlockGuard->assertBlockIdAllowed($viewer, (int) $fields['block_id']);
        } elseif ($this->recipesBlockGuard->isRecipeOnlyUser($viewer)) {
            $blockId = $this->recipesBlockGuard->recipesBlockId();
            if (null === $blockId) {
                throw new AccessDeniedHttpException('Блок recipes не найден');
            }
            $fields['block_id'] = $blockId;
        }
        $propertyValues = $this->extractPropertyValuesInput($fields);
        $sectionIds = $this->extractSectionIdsInput($fields);
        $element = new Element();
        $this->applyFields($element, $fields);
        $user = $viewer;
        if ($user instanceof User) {
            $element->setCreatedBy($user);
            $element->setUpdatedBy($user);
        }
        if (null !== $propertyValues) {
            $this->syncPropertyValues($element, $propertyValues);
        }
        $this->syncSections($element, $sectionIds, $fields);
        $this->validateEntity($element);
        $this->elementRepository->save($element, true);

        return (int) $element->getId();
    }

    /** @param array<string, mixed> $fields */
    public function update(int $id, array $fields): void
    {
        /** @var Element $element */
        $element = $this->requireEntity($id);
        $viewer = $this->currentUser();
        $this->recipesBlockGuard->assertElementAllowed($viewer, $element);
        if ($viewer instanceof User && !$this->canWrite($element, $viewer)) {
            throw new AccessDeniedHttpException('Редактировать может только владелец');
        }
        $propertyValues = $this->extractPropertyValuesInput($fields);
        $sectionIds = $this->extractSectionIdsInput($fields);
        $this->applyFields($element, $fields);
        if ($viewer instanceof User) {
            $element->setUpdatedBy($viewer);
        }
        if (null !== $propertyValues) {
            $this->syncPropertyValues($element, $propertyValues);
        }
        $this->syncSections($element, $sectionIds, $fields);
        $this->validateEntity($element);
        $this->elementRepository->save($element, true);
    }

    public function delete(int $id): void
    {
        /** @var Element $element */
        $element = $this->requireEntity($id);
        $viewer = $this->currentUser();
        $this->recipesBlockGuard->assertElementAllowed($viewer, $element);
        if ($viewer instanceof User && !$this->canWrite($element, $viewer)) {
            throw new AccessDeniedHttpException('Удалить может только владелец');
        }
        $this->elementRepository->remove($element, true);
    }

    public function shareElement(int $elementId, string $email): array
    {
        /** @var Element $element */
        $element = $this->requireEntity($elementId);
        $owner = $this->currentUser();
        $this->recipesBlockGuard->assertElementAllowed($owner, $element);
        if (!$owner instanceof User || !$this->isOwner($element, $owner)) {
            throw new AccessDeniedHttpException('Делиться может только владелец');
        }
        $email = trim($email);
        if ('' === $email) {
            throw new BadRequestHttpException('Укажите email');
        }
        $target = $this->userRepository->findOneBy(['email' => $email]);
        if (!$target instanceof User) {
            throw new NotFoundHttpException('Пользователь с таким email не найден');
        }
        if ($target->getId() === $owner->getId()) {
            throw new BadRequestHttpException('Нельзя поделиться с самим собой');
        }
        foreach ($element->getShares() as $existing) {
            if ($existing->getUser()?->getId() === $target->getId()) {
                return $this->serializeDetail($element, $owner);
            }
        }
        $share = new ElementShare();
        $share->setUser($target);
        $element->addShare($share);
        $this->entityManager->persist($share);
        $this->entityManager->flush();

        return $this->serializeDetail($element, $owner);
    }

    public function unshareElement(int $elementId, int $userId): array
    {
        /** @var Element $element */
        $element = $this->requireEntity($elementId);
        $owner = $this->currentUser();
        $this->recipesBlockGuard->assertElementAllowed($owner, $element);
        if (!$owner instanceof User || !$this->isOwner($element, $owner)) {
            throw new AccessDeniedHttpException('Управлять доступом может только владелец');
        }
        foreach ($element->getShares() as $share) {
            if ($share->getUser()?->getId() === $userId) {
                $element->removeShare($share);
                $this->entityManager->remove($share);
                $this->entityManager->flush();

                return $this->serializeDetail($element, $owner);
            }
        }

        throw new NotFoundHttpException('Доступ не найден');
    }

    protected function serializeListItem(object $entity, ?User $viewer = null): array
    {
        /** @var Element $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'block_id' => $entity->getBlock()?->getId(),
            'section_id' => $entity->getSection()?->getId(),
            'section_ids' => $entity->getSectionIds(),
            'preview_text' => $entity->getPreviewText(),
            'preview_image' => IblockImageRef::serialize($entity->getPreviewImage()),
            'detail_image' => IblockImageRef::serialize($entity->getDetailImage()),
            'preview_image_id' => $entity->getPreviewImage()?->getId(),
            'detail_image_id' => $entity->getDetailImage()?->getId(),
            'cover' => $this->serializeCoverFile($entity),
            'created_by' => $this->serializeUserRef($entity->getCreatedBy()),
            'updated_by' => $this->serializeUserRef($entity->getUpdatedBy()),
            'is_owner' => $viewer instanceof User ? $this->isOwner($entity, $viewer) : false,
            'can_write' => $viewer instanceof User ? $this->canWrite($entity, $viewer) : true,
            'is_shared' => $viewer instanceof User ? $this->isSharedWith($entity, $viewer) : false,
        ];
    }

    protected function serializeDetail(object $entity, ?User $viewer = null): array
    {
        /** @var Element $entity */
        $isOwner = $viewer instanceof User ? $this->isOwner($entity, $viewer) : false;

        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'description' => $entity->getDescription(),
            'preview_text' => $entity->getPreviewText(),
            'detail_text' => $entity->getDetailText(),
            'preview_image' => IblockImageRef::serialize($entity->getPreviewImage()),
            'detail_image' => IblockImageRef::serialize($entity->getDetailImage()),
            'preview_image_id' => $entity->getPreviewImage()?->getId(),
            'detail_image_id' => $entity->getDetailImage()?->getId(),
            'sort' => $entity->getSort(),
            'active' => $entity->isActive(),
            'active_from' => $entity->getActiveFrom('Y-m-d H:i:s'),
            'active_to' => $entity->getActiveTo('Y-m-d H:i:s'),
            'block_id' => $entity->getBlock()?->getId(),
            'section_id' => $entity->getSection()?->getId(),
            'section_ids' => $entity->getSectionIds(),
            'PROPERTY_VALUES' => $this->serializePropertyValues($entity),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
            'created_by' => $this->serializeUserRef($entity->getCreatedBy()),
            'updated_by' => $this->serializeUserRef($entity->getUpdatedBy()),
            'is_owner' => $isOwner,
            'can_write' => $viewer instanceof User ? $this->canWrite($entity, $viewer) : true,
            'is_shared' => $viewer instanceof User ? $this->isSharedWith($entity, $viewer) : false,
            'shares' => $isOwner ? $this->serializeShares($entity) : [],
        ];
    }

    protected function createEntity(array $fields): object
    {
        $element = new Element();
        $this->applyFields($element, $fields);

        return $element;
    }

    protected function applyFields(object $entity, array $fields): void
    {
        /** @var Element $entity */
        if (array_key_exists('code', $fields)) {
            $entity->setCode((string) $fields['code']);
        }
        if (array_key_exists('name', $fields)) {
            $entity->setName((string) $fields['name']);
        }
        if (array_key_exists('description', $fields)) {
            $entity->setDescription($fields['description']);
        }
        if (array_key_exists('preview_text', $fields)) {
            $entity->setPreviewText($fields['preview_text']);
        }
        if (array_key_exists('detail_text', $fields)) {
            $entity->setDetailText($fields['detail_text']);
        }
        IblockImageRef::applyTo($entity, $fields, $this->entityManager);
        if (array_key_exists('sort', $fields)) {
            $entity->setSort((int) $fields['sort']);
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
        if (array_key_exists('block_id', $fields)) {
            $block = null;
            if (null !== $fields['block_id'] && '' !== $fields['block_id']) {
                $block = $this->blockRepository->find((int) $fields['block_id']);
            }
            $entity->setBlock($block);
        }
        if (array_key_exists('section_id', $fields)) {
            $section = null;
            if (null !== $fields['section_id'] && '' !== $fields['section_id']) {
                $section = $this->sectionRepository->find((int) $fields['section_id']);
            }
            $entity->setSection($section);
        }
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return list<int>|null
     */
    private function extractSectionIdsInput(array &$fields): ?array
    {
        if (array_key_exists('section_ids', $fields)) {
            $raw = $fields['section_ids'];
            unset($fields['section_ids'], $fields['sections'], $fields['IBLOCK_SECTION']);
            if (!\is_array($raw)) {
                return [];
            }

            return array_values(array_map('intval', $raw));
        }
        if (array_key_exists('sections', $fields) && \is_array($fields['sections'])) {
            $raw = $fields['sections'];
            unset($fields['sections'], $fields['IBLOCK_SECTION']);

            return array_values(array_map('intval', $raw));
        }
        if (array_key_exists('IBLOCK_SECTION', $fields) && \is_array($fields['IBLOCK_SECTION'])) {
            $raw = $fields['IBLOCK_SECTION'];
            unset($fields['IBLOCK_SECTION']);

            return array_values(array_map('intval', $raw));
        }

        return null;
    }

    /**
     * @param list<int>|null       $sectionIds
     * @param array<string, mixed> $fields
     */
    private function syncSections(Element $element, ?array $sectionIds, array $fields): void
    {
        if (null !== $sectionIds) {
            $this->sectionElementManager->setSections($element, $sectionIds, true);

            return;
        }

        if (array_key_exists('section_id', $fields)) {
            $this->sectionElementManager->ensurePrimaryLink($element);
        }
    }

    /**
     * @param array<string, mixed>                                                  $filter
     * @param array<int, array{key?: string, order?: string}>|array<string, string> $order
     */
    private function buildFilteredQuery(
        array $filter,
        array $order = [],
        ?int $limit = null,
        ?int $offset = null,
    ): QueryBuilder {
        [$baseFilter, $propertyFilters] = $this->splitPropertyFilters($filter);

        $sectionId = null;
        if (isset($baseFilter['section_id']) && '' !== $baseFilter['section_id'] && null !== $baseFilter['section_id']) {
            $sectionId = (int) $baseFilter['section_id'];
            unset($baseFilter['section_id']);
        }

        $accessibleFor = null;
        if (isset($baseFilter['accessible_for']) && '' !== $baseFilter['accessible_for'] && null !== $baseFilter['accessible_for']) {
            $accessibleFor = (int) $baseFilter['accessible_for'];
            unset($baseFilter['accessible_for']);
        }

        $qb = $this->elementRepository->getQueryBuilder(
            $baseFilter,
            $this->normalizeOrder($order),
            null === $limit ? 0 : (int) $limit,
            null === $offset ? 1 : (int) $offset,
            'e',
        );

        if (null !== $accessibleFor && $accessibleFor > 0) {
            $qb->leftJoin('e.shares', 'esh_acc')
                ->andWhere('(e.createdBy IS NULL OR e.createdBy = :acc_user OR esh_acc.user = :acc_user)')
                ->setParameter('acc_user', $accessibleFor)
                ->distinct();
        }

        if (null !== $sectionId) {
            $this->applySectionModeConstraint($qb, $sectionId, $propertyFilters);
        } else {
            $this->applyPropertyFilters($qb, $propertyFilters, 'e');
        }

        return $qb;
    }

    /**
     * @param array<string, mixed> $requestPropertyFilters
     */
    private function applySectionModeConstraint(QueryBuilder $qb, int $sectionId, array $requestPropertyFilters): void
    {
        $section = $this->sectionRepository->find($sectionId);
        if (!$section instanceof Section) {
            $qb->andWhere('1 = 0');

            return;
        }

        $mode = $section->getBlock()?->getSectionMode() ?? 'tree';
        $useBind = \in_array($mode, ['bind', 'tree', 'bind_filter'], true);
        $useFilter = \in_array($mode, ['filter', 'bind_filter'], true);

        $bindExpr = null;
        if ($useBind) {
            $sectionIds = 'bind' === $mode
                ? [$sectionId]
                : $this->sectionElementManager->collectSubtreeSectionIds($section);
            if ([] === $sectionIds) {
                $sectionIds = [$sectionId];
            }
            $bindExpr = sprintf(
                'EXISTS (SELECT 1 FROM %s se_bind WHERE se_bind.element = e AND se_bind.section IN (:section_mode_ids) AND se_bind.additionalPropertyId = 0)',
                SectionElement::class,
            );
            $qb->setParameter('section_mode_ids', $sectionIds);
        }

        $inheritedPropertyFilters = [];
        $inheritedBaseParts = [];
        if ($useFilter) {
            $inherited = $this->sectionElementManager->resolveInheritedFilter($section);
            [$inheritedBase, $inheritedPropertyFilters] = $this->splitPropertyFilters($inherited);
            foreach ($inheritedBase as $key => $value) {
                if ('active' === $key && null !== $value && '' !== $value) {
                    $inheritedBaseParts[] = 'e.active = :sec_flt_active';
                    $qb->setParameter('sec_flt_active', (bool) $value);
                } elseif ('code' === $key && null !== $value && '' !== $value) {
                    $inheritedBaseParts[] = 'e.code = :sec_flt_code';
                    $qb->setParameter('sec_flt_code', (string) $value);
                } elseif ('name' === $key && null !== $value && '' !== $value) {
                    $inheritedBaseParts[] = 'e.name = :sec_flt_name';
                    $qb->setParameter('sec_flt_name', (string) $value);
                }
            }
        }

        $filterExpr = null;
        if ($useFilter) {
            $parts = $inheritedBaseParts;
            $i = 0;
            foreach ($inheritedPropertyFilters as $key => $value) {
                $code = substr($key, strlen('PROPERTY_'));
                if ('' === $code) {
                    continue;
                }
                $epAlias = 'epv_sf'.$i;
                $pAlias = 'prop_sf'.$i;
                $enAlias = 'enum_sf'.$i;
                $codeParam = 'sec_prop_code_'.$i;
                $valParam = 'sec_prop_val_'.$i;
                $idParam = 'sec_prop_id_'.$i;
                $dql = sprintf(
                    'EXISTS (SELECT 1 FROM %s %s INNER JOIN %s.property %s LEFT JOIN %s.valueL %s WHERE %s.element = e AND %s.code = :%s AND (%s))',
                    ElementPropertyValue::class,
                    $epAlias,
                    $epAlias,
                    $pAlias,
                    $epAlias,
                    $enAlias,
                    $epAlias,
                    $pAlias,
                    $codeParam,
                    $this->buildPropertyValueMatch($epAlias, $enAlias, $value, $valParam, $idParam),
                );
                $parts[] = $dql;
                $qb->setParameter($codeParam, $code);
                if (is_string($value) && str_contains($value, '%')) {
                    $qb->setParameter($valParam, $value);
                } elseif (is_int($value) || (is_string($value) && ctype_digit($value))) {
                    $qb->setParameter($valParam, (string) $value);
                    $qb->setParameter($idParam, (int) $value);
                } else {
                    $qb->setParameter($valParam, is_scalar($value) ? (string) $value : json_encode($value));
                }
                ++$i;
            }
            if ([] !== $parts) {
                $filterExpr = '('.implode(' AND ', $parts).')';
            } else {
                // empty inherited filter matches nothing in filter-only; for bind_filter treat as false
                $filterExpr = '1 = 0';
            }
        }

        if ($useBind && $useFilter && null !== $bindExpr && null !== $filterExpr) {
            $qb->andWhere('('.$bindExpr.' OR '.$filterExpr.')');
        } elseif ($useBind && null !== $bindExpr) {
            $qb->andWhere($bindExpr);
        } elseif ($useFilter && null !== $filterExpr) {
            $qb->andWhere($filterExpr);
        } else {
            // fallback tree-like primary
            $qb->andWhere('e.section = :section_mode_fallback')->setParameter('section_mode_fallback', $sectionId);
        }

        $this->applyPropertyFilters($qb, $requestPropertyFilters, 'e');
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>|null
     */
    private function extractPropertyValuesInput(array &$fields): ?array
    {
        $values = null;
        if (array_key_exists('PROPERTY_VALUES', $fields)) {
            $values = is_array($fields['PROPERTY_VALUES']) ? $fields['PROPERTY_VALUES'] : [];
            unset($fields['PROPERTY_VALUES']);
        } elseif (array_key_exists('properties', $fields)) {
            $values = is_array($fields['properties']) ? $fields['properties'] : [];
            unset($fields['properties']);
        }

        return $values;
    }

    /**
     * @param array<string, mixed> $values
     */
    private function syncPropertyValues(Element $element, array $values): void
    {
        foreach ($values as $code => $value) {
            $code = (string) $code;
            $property = $this->resolvePropertyByCode($element, $code);
            if (!$property instanceof Property) {
                throw new BadRequestHttpException(sprintf('Unknown property code: %s', $code));
            }

            foreach ($element->getPropertyValues()->toArray() as $existing) {
                if ($existing->getProperty()?->getId() === $property->getId()) {
                    $element->removePropertyValue($existing);
                }
            }

            if (null === $value || '' === $value || [] === $value) {
                continue;
            }

            if ($this->isListFieldType($property->getFieldType())) {
                $items = is_array($value) ? $value : [$value];
                $enums = [];
                foreach ($items as $item) {
                    if (null === $item || '' === $item) {
                        continue;
                    }
                    $enum = $this->resolveEnum($property, $item);
                    if (!$enum instanceof PropertyEnum) {
                        throw new BadRequestHttpException(sprintf('Unknown enum value for property %s', $code));
                    }
                    $enums[] = $enum;
                }
                if ([] === $enums) {
                    continue;
                }
                $row = new ElementPropertyValue();
                $row->setTypedValue($property, $enums);
                $element->addPropertyValue($row);
                continue;
            }

            $items = ($property->isMultiple() && is_array($value)) ? $value : [$value];
            foreach ($items as $item) {
                if (null === $item || '' === $item) {
                    continue;
                }
                $resolved = $this->resolveTypedPropertyItem($property, $item);
                $row = new ElementPropertyValue();
                $row->setTypedValue($property, $resolved);
                $element->addPropertyValue($row);
            }
        }
    }

    private function resolveTypedPropertyItem(Property $property, mixed $item): mixed
    {
        $fieldType = strtoupper($property->getFieldType());

        if ('F' === $fieldType) {
            $fileId = $this->extractId($item);
            if (null === $fileId) {
                throw new BadRequestHttpException(sprintf('Invalid file id for property %s', $property->getCode()));
            }
            $file = $this->entityManager->find(MainFile::class, $fileId);
            if (!$file instanceof MainFile) {
                throw new BadRequestHttpException(sprintf('File #%d not found', $fileId));
            }
            PropertyFileType::assertAllowed($property->getFileType(), $file);

            return $file;
        }

        if ('E' === $fieldType) {
            $linkBlock = $property->getLinkIblock();
            if (!$linkBlock) {
                throw new BadRequestHttpException(sprintf('Property %s has no link_iblock_id', $property->getCode()));
            }
            $elementId = $this->extractId($item);
            if (null === $elementId) {
                throw new BadRequestHttpException(sprintf('Invalid element id for property %s', $property->getCode()));
            }
            $linked = $this->elementRepository->find($elementId);
            if (!$linked instanceof Element) {
                throw new BadRequestHttpException(sprintf('Element #%d not found', $elementId));
            }
            if ($linked->getBlock()?->getId() !== $linkBlock->getId()) {
                throw new BadRequestHttpException(sprintf(
                    'Element #%d does not belong to link_iblock_id #%d',
                    $elementId,
                    $linkBlock->getId(),
                ));
            }

            return $linked;
        }

        if ('G' === $fieldType) {
            $linkBlock = $property->getLinkIblock();
            if (!$linkBlock) {
                throw new BadRequestHttpException(sprintf('Property %s has no link_iblock_id', $property->getCode()));
            }
            $sectionId = $this->extractId($item);
            if (null === $sectionId) {
                throw new BadRequestHttpException(sprintf('Invalid section id for property %s', $property->getCode()));
            }
            $section = $this->sectionRepository->find($sectionId);
            if (!$section instanceof Section) {
                throw new BadRequestHttpException(sprintf('Section #%d not found', $sectionId));
            }
            if ($section->getBlock()?->getId() !== $linkBlock->getId()) {
                throw new BadRequestHttpException(sprintf(
                    'Section #%d does not belong to link_iblock_id #%d',
                    $sectionId,
                    $linkBlock->getId(),
                ));
            }

            return $section;
        }

        return $item;
    }

    private function extractId(mixed $item): ?int
    {
        if (is_int($item)) {
            return $item;
        }
        if (is_string($item) && ctype_digit($item)) {
            return (int) $item;
        }
        if (is_array($item) && isset($item['id']) && (is_int($item['id']) || (is_string($item['id']) && ctype_digit((string) $item['id'])))) {
            return (int) $item['id'];
        }

        return null;
    }

    private function resolvePropertyByCode(Element $element, string $code): ?Property
    {
        $block = $element->getBlock();
        if ($block) {
            $property = $this->propertyRepository->findOneBy(['code' => $code, 'block' => $block]);
            if ($property instanceof Property) {
                return $property;
            }
        }

        $property = $this->propertyRepository->findOneBy(['code' => $code]);

        return $property instanceof Property ? $property : null;
    }

    private function isListFieldType(string $fieldType): bool
    {
        return 'L' === strtoupper($fieldType);
    }

    private function resolveEnum(Property $property, mixed $value): ?PropertyEnum
    {
        if ($value instanceof PropertyEnum) {
            return $value;
        }

        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            $enum = $this->propertyEnumRepository->find((int) $value);
            if ($enum instanceof PropertyEnum && $enum->getProperty()?->getId() === $property->getId()) {
                return $enum;
            }
        }

        $code = (string) $value;
        $enum = $this->propertyEnumRepository->findOneBy(['property' => $property, 'code' => $code]);

        return $enum instanceof PropertyEnum ? $enum : null;
    }

    /** @return array{id: int, name: string, src: string}|null */
    private function serializeCoverFile(Element $element): ?array
    {
        $detail = IblockImageRef::serialize($element->getDetailImage());
        if (null !== $detail) {
            return $detail;
        }

        foreach ($element->getPropertyValues() as $row) {
            $property = $row->getProperty();
            if (!$property || 'COVER' !== strtoupper((string) $property->getCode())) {
                continue;
            }
            if ('F' !== strtoupper($property->getFieldType())) {
                continue;
            }
            $file = $row->getValueFile();
            if (!$file) {
                continue;
            }

            return [
                'id' => (int) $file->getId(),
                'name' => (string) $file->getOriginalName(),
                'src' => (string) $file->getFileSRC(),
            ];
        }

        return null;
    }

    /** @return array<string, mixed> */
    private function serializePropertyValues(Element $element): array
    {
        /** @var array<string, list<mixed>> $grouped */
        $grouped = [];
        foreach ($element->getPropertyValues() as $row) {
            $property = $row->getProperty();
            if (!$property) {
                continue;
            }
            $code = (string) $property->getCode();
            $fieldType = strtoupper($property->getFieldType());

            if ($this->isListFieldType($fieldType)) {
                foreach ($row->getValueL() as $enum) {
                    $grouped[$code][] = $enum->getId();
                }
                continue;
            }

            if ('F' === $fieldType) {
                $file = $row->getValueFile();
                if ($file) {
                    $grouped[$code][] = [
                        'id' => $file->getId(),
                        'name' => $file->getOriginalName(),
                        'src' => $file->getFileSRC(),
                    ];
                }
                continue;
            }

            if ('E' === $fieldType) {
                $linked = $row->getValueElement();
                if ($linked) {
                    $grouped[$code][] = [
                        'id' => $linked->getId(),
                        'name' => $linked->getName(),
                        'code' => $linked->getCode(),
                    ];
                }
                continue;
            }

            if ('G' === $fieldType) {
                $section = $row->getValueSection();
                if ($section) {
                    $grouped[$code][] = [
                        'id' => $section->getId(),
                        'name' => $section->getName(),
                        'code' => $section->getCode(),
                    ];
                }
                continue;
            }

            if ('N' === $fieldType && null !== $row->getValueN()) {
                $grouped[$code][] = $row->getValueN();
            } elseif (null !== $row->getValueS()) {
                $grouped[$code][] = $row->getValueS();
            } elseif (null !== $row->getValueN() && (null === $row->getValue() || is_numeric($row->getValue()))) {
                $grouped[$code][] = $row->getValueN();
            } else {
                $grouped[$code][] = $row->getValue();
            }
        }

        $result = [];
        foreach ($grouped as $code => $values) {
            $property = $this->resolvePropertyByCode($element, $code);
            $multiple = $property?->isMultiple() ?? (count($values) > 1);
            $result[$code] = $multiple ? array_values($values) : $values[0];
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $filter
     *
     * @return array{0: array<string, mixed>, 1: array<string, mixed>}
     */
    private function splitPropertyFilters(array $filter): array
    {
        $propertyFilters = [];
        foreach ($filter as $key => $value) {
            if (str_starts_with((string) $key, 'PROPERTY_')) {
                $propertyFilters[(string) $key] = $value;
                unset($filter[$key]);
            }
        }

        return [$filter, $propertyFilters];
    }

    /**
     * @param array<string, mixed> $propertyFilters
     */
    private function applyPropertyFilters(QueryBuilder $qb, array $propertyFilters, string $alias): void
    {
        $i = 0;
        foreach ($propertyFilters as $key => $value) {
            $code = substr($key, strlen('PROPERTY_'));
            if ('' === $code) {
                continue;
            }

            $epAlias = 'epv_f'.$i;
            $pAlias = 'prop_f'.$i;
            $enAlias = 'enum_f'.$i;
            $codeParam = 'prop_code_'.$i;
            $valParam = 'prop_val_'.$i;
            $idParam = 'prop_id_'.$i;

            $dql = sprintf(
                'SELECT 1 FROM %s %s INNER JOIN %s.property %s LEFT JOIN %s.valueL %s WHERE %s.element = %s AND %s.code = :%s AND (%s)',
                ElementPropertyValue::class,
                $epAlias,
                $epAlias,
                $pAlias,
                $epAlias,
                $enAlias,
                $epAlias,
                $alias,
                $pAlias,
                $codeParam,
                $this->buildPropertyValueMatch($epAlias, $enAlias, $value, $valParam, $idParam),
            );

            $qb->andWhere($qb->expr()->exists($dql));
            $qb->setParameter($codeParam, $code);

            if (is_string($value) && str_contains($value, '%')) {
                $qb->setParameter($valParam, $value);
            } elseif (is_int($value) || (is_string($value) && ctype_digit($value))) {
                $qb->setParameter($valParam, (string) $value);
                $qb->setParameter($idParam, (int) $value);
            } else {
                $qb->setParameter($valParam, is_scalar($value) ? (string) $value : json_encode($value));
            }

            ++$i;
        }
    }

    private function buildPropertyValueMatch(
        string $epAlias,
        string $enAlias,
        mixed $value,
        string $valParam,
        string $idParam,
    ): string {
        if (is_string($value) && str_contains($value, '%')) {
            return sprintf(
                '%s.value LIKE :%s OR %s.valueS LIKE :%s',
                $epAlias,
                $valParam,
                $epAlias,
                $valParam,
            );
        }

        if (is_int($value) || (is_string($value) && ctype_digit($value))) {
            return sprintf(
                '%s.value = :%s OR %s.valueS = :%s OR %s.valueN = :%s OR %s.id = :%s'
                .' OR IDENTITY(%s.valueFile) = :%s OR IDENTITY(%s.valueElement) = :%s OR IDENTITY(%s.valueSection) = :%s',
                $epAlias,
                $valParam,
                $epAlias,
                $valParam,
                $epAlias,
                $idParam,
                $enAlias,
                $idParam,
                $epAlias,
                $idParam,
                $epAlias,
                $idParam,
                $epAlias,
                $idParam,
            );
        }

        return sprintf(
            '%s.value = :%s OR %s.valueS = :%s OR %s.code = :%s',
            $epAlias,
            $valParam,
            $epAlias,
            $valParam,
            $enAlias,
            $valParam,
        );
    }

    private function currentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }

    private function isElevated(?User $user): bool
    {
        if (!$user instanceof User) {
            return false;
        }

        if ($this->security->isGranted('ROLE_ROOT')
            || $this->security->isGranted('ROLE_IBLOCK_ROOT')
            || $this->security->isGranted('ROLE_IBLOCK_ADMIN')) {
            return true;
        }

        return $this->recipeIblockBridge->isRecipeElevated($user);
    }

    private function isOwner(Element $element, User $user): bool
    {
        $ownerId = $element->getCreatedBy()?->getId();
        if (null === $ownerId) {
            return false;
        }

        return $ownerId === $user->getId();
    }

    private function isSharedWith(Element $element, User $user): bool
    {
        foreach ($element->getShares() as $share) {
            if ($share->getUser()?->getId() === $user->getId()) {
                return true;
            }
        }

        return false;
    }

    private function canRead(Element $element, User $user): bool
    {
        if ($this->isElevated($user)) {
            return true;
        }
        if (null === $element->getCreatedBy()) {
            return true;
        }

        return $this->isOwner($element, $user) || $this->isSharedWith($element, $user);
    }

    private function canWrite(Element $element, User $user): bool
    {
        if ($this->isElevated($user)) {
            return true;
        }
        if (null === $element->getCreatedBy()) {
            return true;
        }

        return $this->isOwner($element, $user);
    }

    /** @return array{id: ?int, email: ?string, alias: ?string} */
    private function serializeUserRef(?User $user): array
    {
        return [
            'id' => $user?->getId(),
            'email' => $user?->getEmail(),
            'alias' => $user?->getAlias(),
        ];
    }

    /** @return list<array{user_id: ?int, email: ?string, alias: ?string, permission: string}> */
    private function serializeShares(Element $element): array
    {
        $shares = [];
        foreach ($element->getShares() as $share) {
            $user = $share->getUser();
            $shares[] = [
                'user_id' => $user?->getId(),
                'email' => $user?->getEmail(),
                'alias' => $user?->getAlias(),
                'permission' => 'read',
            ];
        }

        return $shares;
    }
}
