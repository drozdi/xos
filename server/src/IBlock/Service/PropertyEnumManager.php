<?php

namespace IBlock\Service;

use AbstractRepository;
use Doctrine\ORM\EntityManagerInterface;
use IBlock\Entity\Property\Enum as PropertyEnum;
use IBlock\Repository\PropertyEnumRepository;
use IBlock\Repository\PropertyRepository;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class PropertyEnumManager extends AbstractIBlockManager
{
    public function __construct(
        ValidatorInterface $validator,
        EntityManagerInterface $entityManager,
        private readonly PropertyEnumRepository $propertyEnumRepository,
        private readonly PropertyRepository $propertyRepository,
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
}
