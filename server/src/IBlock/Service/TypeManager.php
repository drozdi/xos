<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Type;
use IBlock\Repository\TypeRepository;
use IBlock\Security\RecipesBlockGuard;
use Main\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class TypeManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly TypeRepository $typeRepository,
        private readonly RecipesBlockGuard $recipesBlockGuard,
        private readonly Security $security,
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

    public function getById(int $id): ?array
    {
        $entity = $this->typeRepository->find($id);
        if (!$entity instanceof Type) {
            return null;
        }
        $user = $this->currentUser();
        if ($this->recipesBlockGuard->isRecipeOnlyUser($user) && 'content' !== $entity->getCode()) {
            throw new AccessDeniedHttpException('ROLE_RECIPE: доступен только type content');
        }

        return $this->serializeDetail($entity);
    }

    public function getList(array $order, array $filter, ?int $limit = null, ?int $offset = null): array
    {
        $user = $this->currentUser();
        if ($this->recipesBlockGuard->isRecipeOnlyUser($user)) {
            $filter['code'] = 'content';
        }

        return parent::getList($order, $filter, $limit, $offset);
    }

    public function count(array $filter): int
    {
        $user = $this->currentUser();
        if ($this->recipesBlockGuard->isRecipeOnlyUser($user)) {
            $filter['code'] = 'content';
        }

        return parent::count($filter);
    }

    public function add(array $fields): int
    {
        if ($this->recipesBlockGuard->isRecipeOnlyUser($this->currentUser())) {
            throw new AccessDeniedHttpException('ROLE_RECIPE не может создавать типы');
        }

        return parent::add($fields);
    }

    public function update(int $id, array $fields): void
    {
        if ($this->recipesBlockGuard->isRecipeOnlyUser($this->currentUser())) {
            throw new AccessDeniedHttpException('ROLE_RECIPE не может изменять типы');
        }
        parent::update($id, $fields);
    }

    public function delete(int $id): void
    {
        if ($this->recipesBlockGuard->isRecipeOnlyUser($this->currentUser())) {
            throw new AccessDeniedHttpException('ROLE_RECIPE не может удалять типы');
        }
        parent::delete($id);
    }

    private function currentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
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
