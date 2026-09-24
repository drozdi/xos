<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Section;
use IBlock\Repository\BlockRepository;
use IBlock\Repository\SectionRepository;
use IBlock\Security\RecipesBlockGuard;
use Main\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class SectionManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly SectionRepository $sectionRepository,
        private readonly BlockRepository $blockRepository,
        private readonly SectionElementManager $sectionElementManager,
        private readonly Security $security,
        private readonly RecipesBlockGuard $recipesBlockGuard,
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
            'preview_image' => IblockImageRef::serialize($entity->getPreviewImage()),
            'detail_image' => IblockImageRef::serialize($entity->getDetailImage()),
            'preview_image_id' => $entity->getPreviewImage()?->getId(),
            'detail_image_id' => $entity->getDetailImage()?->getId(),
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
            'element_filter' => $this->serializeFilterMap($entity->getElementFilter()),
            'inherited_element_filter' => $this->serializeFilterMap(
                $this->sectionElementManager->resolveInheritedFilter($entity),
            ),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
            'date_created' => $entity->getDateCreated('Y-m-d H:i:s'),
            'created_by' => $this->serializeUserRef($entity->getCreatedBy()),
            'updated_by' => $this->serializeUserRef($entity->getUpdatedBy()),
            'preview_image' => IblockImageRef::serialize($entity->getPreviewImage()),
            'detail_image' => IblockImageRef::serialize($entity->getDetailImage()),
            'preview_image_id' => $entity->getPreviewImage()?->getId(),
            'detail_image_id' => $entity->getDetailImage()?->getId(),
        ];
    }

    public function getById(int $id): ?array
    {
        $entity = $this->sectionRepository->find($id);
        if (!$entity instanceof Section) {
            return null;
        }
        $this->recipesBlockGuard->assertSectionAllowed($this->currentUser(), $entity);

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

    /** @param array<string, mixed> $fields */
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
        $section = new Section();
        $this->applyFields($section, $fields);
        if ($user instanceof User) {
            $section->setCreatedBy($user);
            $section->setUpdatedBy($user);
        }
        $this->validateEntity($section);
        $this->persistEntity($section, true);

        return (int) $section->getId();
    }

    /** @param array<string, mixed> $fields */
    public function update(int $id, array $fields): void
    {
        /** @var Section $section */
        $section = $this->requireEntity($id);
        $this->recipesBlockGuard->assertSectionAllowed($this->currentUser(), $section);
        $this->applyFields($section, $fields);
        $user = $this->currentUser();
        if ($user instanceof User) {
            $section->setUpdatedBy($user);
        }
        $this->validateEntity($section);
        $this->persistEntity($section, true);
    }

    public function delete(int $id): void
    {
        /** @var Section $section */
        $section = $this->requireEntity($id);
        $this->recipesBlockGuard->assertSectionAllowed($this->currentUser(), $section);
        $this->getRepository()->remove($section, true);
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
        IblockImageRef::applyTo($entity, $fields, $this->entityManager);
    }

    private function currentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }

    /**
     * Empty PHP arrays must serialize as {} for JSON clients expecting records.
     *
     * @param array<string, mixed>|null $filter
     *
     * @return array<string, mixed>|\stdClass|null
     */
    private function serializeFilterMap(?array $filter): array|\stdClass|null
    {
        if (null === $filter) {
            return null;
        }
        if ([] === $filter) {
            return new \stdClass();
        }

        return $filter;
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
}
