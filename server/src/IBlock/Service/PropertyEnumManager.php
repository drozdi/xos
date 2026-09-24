<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Property;
use IBlock\Entity\Property\Enum as PropertyEnum;
use IBlock\Repository\PropertyEnumRepository;
use IBlock\Repository\PropertyRepository;
use IBlock\Security\RecipesBlockGuard;
use Main\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class PropertyEnumManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly PropertyEnumRepository $propertyEnumRepository,
        private readonly PropertyRepository $propertyRepository,
        private readonly RecipesBlockGuard $recipesBlockGuard,
        private readonly Security $security,
    ) {
        parent::__construct($validator, $entityManager);
    }

    protected function getRepository(): AbstractRepository
    {
        return $this->propertyEnumRepository;
    }

    protected function getListAlias(): string
    {
        return 'pe';
    }

    protected function serializeListItem(object $entity): array
    {
        /** @var PropertyEnum $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'default' => $entity->isDefault(),
            'property_id' => $entity->getProperty()?->getId(),
        ];
    }

    protected function serializeDetail(object $entity): array
    {
        /** @var PropertyEnum $entity */
        return [
            'id' => $entity->getId(),
            'code' => $entity->getCode(),
            'name' => $entity->getName(),
            'sort' => $entity->getSort(),
            'default' => $entity->isDefault(),
            'property_id' => $entity->getProperty()?->getId(),
            'x_timestamp' => $entity->getXTimestamp('Y-m-d H:i:s'),
        ];
    }

    public function getById(int $id): ?array
    {
        $entity = $this->propertyEnumRepository->find($id);
        if (!$entity instanceof PropertyEnum) {
            return null;
        }
        $property = $entity->getProperty();
        if ($property instanceof Property) {
            $this->recipesBlockGuard->assertPropertyAllowed($this->currentUser(), $property);
        }

        return $this->serializeDetail($entity);
    }

    public function getList(array $order, array $filter, ?int $limit = null, ?int $offset = null): array
    {
        $this->assertPropertyFilterAllowed($filter);

        return parent::getList($order, $filter, $limit, $offset);
    }

    public function count(array $filter): int
    {
        $this->assertPropertyFilterAllowed($filter);

        return parent::count($filter);
    }

    public function add(array $fields): int
    {
        $this->assertPropertyIdAllowed($fields['property_id'] ?? null);

        return parent::add($fields);
    }

    public function update(int $id, array $fields): void
    {
        /** @var PropertyEnum $enum */
        $enum = $this->requireEntity($id);
        $property = $enum->getProperty();
        if ($property instanceof Property) {
            $this->recipesBlockGuard->assertPropertyAllowed($this->currentUser(), $property);
        }
        if (array_key_exists('property_id', $fields)) {
            $this->assertPropertyIdAllowed($fields['property_id']);
        }
        parent::update($id, $fields);
    }

    public function delete(int $id): void
    {
        /** @var PropertyEnum $enum */
        $enum = $this->requireEntity($id);
        $property = $enum->getProperty();
        if ($property instanceof Property) {
            $this->recipesBlockGuard->assertPropertyAllowed($this->currentUser(), $property);
        }
        parent::delete($id);
    }

    protected function createEntity(array $fields): object
    {
        $enum = new PropertyEnum();
        $this->applyFields($enum, $fields);
        if (!$enum->getProperty()) {
            throw new BadRequestHttpException('property_id is required');
        }

        return $enum;
    }

    protected function applyFields(object $entity, array $fields): void
    {
        /** @var PropertyEnum $entity */
        if (array_key_exists('code', $fields)) {
            $entity->setCode((string) $fields['code']);
        }
        if (array_key_exists('name', $fields)) {
            $entity->setName((string) $fields['name']);
        }
        if (array_key_exists('sort', $fields)) {
            $entity->setSort((int) $fields['sort']);
        }
        if (array_key_exists('default', $fields)) {
            $entity->setDefault((bool) $fields['default']);
        }
        if (array_key_exists('property_id', $fields)) {
            $property = null;
            if (null !== $fields['property_id'] && '' !== $fields['property_id']) {
                $property = $this->propertyRepository->find((int) $fields['property_id']);
            }
            $entity->setProperty($property);
        }
    }

    /** @param array<string, mixed> $filter */
    private function assertPropertyFilterAllowed(array $filter): void
    {
        if (!$this->recipesBlockGuard->isRecipeOnlyUser($this->currentUser())) {
            return;
        }
        if (!isset($filter['property_id']) || '' === $filter['property_id'] || null === $filter['property_id']) {
            throw new \Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException('ROLE_RECIPE: укажите property_id');
        }
        $this->assertPropertyIdAllowed($filter['property_id']);
    }

    private function assertPropertyIdAllowed(mixed $propertyId): void
    {
        $property = $this->propertyRepository->find((int) $propertyId);
        if (!$property instanceof Property) {
            throw new BadRequestHttpException('property_id not found');
        }
        $this->recipesBlockGuard->assertPropertyAllowed($this->currentUser(), $property);
    }

    private function currentUser(): ?User
    {
        $user = $this->security->getUser();

        return $user instanceof User ? $user : null;
    }
}
