<?php
/**
 * Created by PhpStorm.
 * User: drozd
 * Date: 01.12.2019
 * Time: 12:40
 */

namespace Device\Service;

use AbstractManager;
use Device\Entity\Type;
use Device\Entity\Property;
use Device\Entity\PropertyEnum;

use Device\Entity\Device;
use Device\Entity\Device\Property as DeviceProperty;
use Device\Entity\Accounting;
use Device\Entity\License;
use Device\Entity\Software;

use Device\Repository\TypeRepository;
use Device\Repository\PropertyRepository;
use Device\Repository\PropertyEnumRepository;
use Device\Repository\DeviceRepository;
use Device\Repository\AccountingRepository;
use Device\Repository\Device\PropertyRepository as DevicePropertyRepository;

use Main\Entity\User;
use Symfony\Component\Validator\Exception\ValidationFailedException;
use Symfony\Component\Validator\Validator\TraceableValidator;
use Symfony\Component\Validator\Validator\ValidatorInterface;

use Symfony\Component\HttpFoundation\Request;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\Common\Collections\Criteria;

class DeviceManager extends AbstractManager {
    protected ?LicenseManager $lm = null;

    function __construct (
        ValidatorInterface $Validator,
        private readonly DevicePropertyValueSerializer $propertyValueSerializer,
        ?LicenseManager $lm = null,
    ) {
        parent::__construct($Validator);
        $this->lm = $lm;
    }
    public function getTypeRepository (): ?TypeRepository {
        return $this->getEntityManager()->getRepository(Type::class);
        //return $this->container->getService(SoftwareRepository::class);
    }
    public function getPropertyRepository (): ?PropertyRepository {
        return $this->getEntityManager()->getRepository(Property::class);
        //return $this->container->getService(SoftwareRepository::class);
    }
    public function getPropertyEnumRepository (): ?PropertyEnumRepository {
        return $this->getEntityManager()->getRepository(PropertyEnum::class);
        //return $this->container->getService(SoftwareRepository::class);
    }
    public function getDeviceRepository (): ?DeviceRepository {
        return $this->getEntityManager()->getRepository(Device::class);
        //return $this->container->getService(SoftwareRepository::class);
    }
    public function getDevicePropertyRepository (): ?DevicePropertyRepository {
        return $this->getEntityManager()->getRepository(Device\Property::class);
        //return $this->container->getService(SoftwareRepository::class);
    }
    public function getAccountingRepository (): ?AccountingRepository {
        return $this->getEntityManager()->getRepository(Accounting::class);
        //return $this->container->getService(SoftwareRepository::class);
    }

    public function type (mixed $type = null, ?array $arType = null, bool $isForm = true): Type {
        if (is_int($type) && $type > 0) {
            $type = $this->getTypeRepository()->find($type);
        } elseif (is_array($type)) {
            $type = $this->getTypeRepository()->findOneBy($type);
        }
        if (!($type instanceof Type)) {
            $type = new Type();
        }
        if (empty($arType)) {
            return $type;
        }
        if (array_key_exists('code', $arType)) {
            $type->setCode($arType['code']);
        }
        if (array_key_exists('name', $arType)) {
            $type->setName($arType['name']);
        }
        if (array_key_exists('sort', $arType)) {
            $type->setSort($arType['sort'] ?: 100);
        }
        if (array_key_exists('active', $arType)) {
            $type->setActive($arType['active']);
        }
        if (array_key_exists('activeFrom', $arType)) {
            $type->setActiveFrom($arType['activeFrom']? new \DateTime($arType['activeFrom']): null);
        }
        if (array_key_exists('activeTo', $arType)) {
            $type->setActiveTo($arType['activeTo']? new \DateTime($arType['activeTo']): null);
        }
        if (array_key_exists('parent', $arType) && $arType['parent'] instanceof Type) {
            $type->setParent($arType['parent']);
        } elseif (array_key_exists('parent', $arType) && (int)$arType['parent_id'] > 0) {
            $type->setParent($this->type((int)$arType['parent_id']));
        }
        if (array_key_exists('property', $arType)  && $arType['property'] instanceof Property) {
            $type->setProperty($arType['property']);
        } elseif (array_key_exists('property_id', $arType)  && (int)$arType['property_id'] > 0) {
            $type->setProperty($this->property((int)$arType['property_id']));
        }
        $errors = $this->getValidator()->validate($type);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arType, $errors);
        }
        $this->getTypeRepository()->save($type, true);

        //$isForm = !empty($arType['components']) || !empty($arType['properties']);

        $arComponents = $arType['components'] ?? [];
        $componentPropertyIds = [];
        foreach ($this->getTypeRepository()->findBy(['id' => $arComponents]) as $componentType) {
            if (null != ($property = $componentType->getProperty())) {
                $componentPropertyIds[] = $property->getId();
            }
        }
        $arProperties = $this->normalizePropertyPayloads($arType['properties'] ?? []);
        foreach ($type->getProperties() as $property) {
            if (false !== ($key = array_search($property->getId(), $componentPropertyIds, true))) {
                unset($componentPropertyIds[$key]);
            } elseif (null !== ($arProperty = $this->consumePropertyPayload($arProperties, (int)$property->getId()))) {
                $type->addProperty($this->property($property, $arProperty));
            } elseif (true === $isForm) {
                $type->removeProperty($property);
            }
        }
        foreach ($this->getPropertyRepository()->findBy([
            'id' => $componentPropertyIds,
        ]) as $property) {
            $type->addProperty($property);
        }
        foreach ($arProperties as $key => $arProperty) {
            if (!is_array($arProperty)) {
                continue;
            }
            $propertyId = (int)($arProperty['id'] ?? $key);
            $type->addProperty($this->property($propertyId > 0 ? $propertyId : null, $arProperty));
        }
        if (true === $isForm) {
            $this->syncDevicesForType($type);
        }
        $this->getEntityManager()->flush();
        return $type;
    }
    public function property (mixed $property = null, ?array $arProperty = null): Property {
        if (is_int($property) && $property > 0) {
            $property = $this->getPropertyRepository()->find($property);
        } elseif (is_array($property)) {
            $property = $this->getPropertyRepository()->findOneBy($property);
        }
        if (!($property instanceof Property)) {
            $property = new Property();
        }
        if (empty($arProperty)) {
            return $property;
        }
        if (array_key_exists('prototype', $arProperty) && $arProperty['prototype'] instanceof Property) {
            $this->propertyJoinPrototype($property, $arProperty['prototype']);
        } elseif (array_key_exists('prototype_id', $arProperty) && (int)$arProperty['prototype_id'] > 0) {
            $this->propertyJoinPrototype($property, $this->property((int)$arProperty['prototype_id']));
        } elseif (array_key_exists('property_id', $arProperty) && (int)$arProperty['property_id'] > 0) {
            $this->propertyJoinPrototype($property, $this->property((int)$arProperty['property_id']));
        }
        if (array_key_exists('active', $arProperty)) {
            $property->setActive((bool)$arProperty['active']);
        }
        if (array_key_exists('activeFrom', $arProperty)) {
            $property->setActiveFrom($arProperty['activeFrom']? new \DateTime($arProperty['activeFrom']): null);
        }
        if (array_key_exists('activeTo', $arProperty)) {
            $property->setActiveTo($arProperty['activeTo']? new \DateTime($arProperty['activeTo']): null);
        }
        if (array_key_exists('required', $arProperty)) {
            $property->setRequired((bool)$arProperty['required']);
        }
        if (array_key_exists('multiple', $arProperty)) {
            $property->setMultiple((bool)$arProperty['multiple']);
        }
        if (array_key_exists('code', $arProperty)) {
            $property->setCode((string)$arProperty['code']);
        }
        if (array_key_exists('name', $arProperty)) {
            $property->setName((string)$arProperty['name']);
        }
        if (array_key_exists('postfix', $arProperty)) {
            $property->setPostfix((string)$arProperty['postfix']);
        }
        if (array_key_exists('prefix', $arProperty)) {
            $property->setPrefix((string)$arProperty['prefix']);
        }
        if (array_key_exists('sort', $arProperty)) {
            $property->setSort((int)$arProperty['sort'] ?: 100);
        }
        if (array_key_exists('fieldType', $arProperty)) {
            $property->setFieldType((string)$arProperty['fieldType']);
        }
        if (array_key_exists('listType', $arProperty)) {
            $property->setListType((string)$arProperty['listType']);
        }
        if (array_key_exists('defaultValue', $arProperty)) {
            $property->setDefaultValue((string)$arProperty['defaultValue']);
        }
        if (array_key_exists('parent', $arProperty) && $arProperty['parent'] instanceof Property) {
            $property->setParent($arProperty['parent']);
        } elseif (array_key_exists('parent_id', $arProperty) && (int)$arProperty['parent_id'] > 0) {
            $property->setParent($this->property((int)$arProperty['parent_id']));
        }

        $errors = $this->getValidator()->validate($property);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arProperty, $errors);
        }

        $this->getPropertyRepository()->save($property, true);

        if (array_key_exists('links', $arProperty) && is_array($arProperty['links']) && null === $property->getPrototype()) {
            $this->syncPropertyLinks($property, $this->normalizeLinksPayload($arProperty['links']));
        }

        $arVarieties = $arProperty['varieties'] ?? [];
        foreach ($arVarieties as $id => $arVariety) {
            if (!is_array($arVariety)) {
                continue;
            }
            $this->propertyJoinPrototype($this->property((int)$id, $arVariety), $property);
        }

        // Enum values live on the linked prototype property when set.
        if (array_key_exists('enums', $arProperty) && is_array($arProperty['enums'])) {
            $enumOwner = $property->getPrototype() ?: $property;
            [$enumById, $newEnums] = $this->splitEnumPayloads($arProperty['enums']);

            foreach ($enumOwner->getEnums(false) as $propertyEnum) {
                $enumId = (int)$propertyEnum->getId();
                if (isset($enumById[$enumId])) {
                    $arEnum = $enumById[$enumId];
                    $propertyEnum->setValue((string)($arEnum['value'] ?? $arEnum['code'] ?? ''));
                    $propertyEnum->setName((string)($arEnum['name'] ?? ''));
                    $propertyEnum->setSort((int)($arEnum['sort'] ?? 100));
                    $propertyEnum->setDefault((bool)($arEnum['default'] ?? false));
                    unset($enumById[$enumId]);
                } else {
                    $this->detachEnumFromDevices($propertyEnum);
                    $enumOwner->removeEnum($propertyEnum);
                    $this->getEntityManager()->remove($propertyEnum);
                }
            }
            foreach (array_merge($enumById, $newEnums) as $arEnum) {
                if (!is_array($arEnum)) {
                    continue;
                }
                $this->getEntityManager()->persist($enumOwner->newEnum()
                    ->setValue((string)($arEnum['value'] ?? $arEnum['code'] ?? ''))
                    ->setName((string)($arEnum['name'] ?? ''))
                    ->setSort((int)($arEnum['sort'] ?? 100))
                    ->setDefault((bool)($arEnum['default'] ?? false)));
            }
        }

        $prototypeSource = $property->getPrototype() ?: $property;
        $this->syncPropertyVariants($prototypeSource);
        $this->syncDevicesForProperties([$prototypeSource, $property]);

        $this->getEntityManager()->flush();

        return $property;
    }

    private function normalizeLinksPayload (array $links): array {
        if (array_is_list($links)) {
            return array_values(array_filter($links, 'is_array'));
        }

        return array_values(array_filter($links, 'is_array'));
    }

    private function syncPropertyLinks (Property $prototype, array $arLinks): void {
        if (!(int)$prototype->getId() || null !== $prototype->getPrototype()) {
            return;
        }

        $existing = [];
        foreach ($this->getPropertyRepository()->findBy(['prototype' => $prototype]) as $variant) {
            foreach ($variant->getTypes() as $type) {
                $existing[$variant->getId().':'.$type->getId()] = [
                    'variant' => $variant,
                    'type' => $type,
                ];
            }
        }

        $kept = [];
        foreach ($arLinks as $arLink) {
            if (!is_array($arLink)) {
                continue;
            }
            if (($arLink['link_kind'] ?? 'property') === 'root') {
                continue;
            }
            $typeId = (int)($arLink['type_id'] ?? 0);
            if ($typeId <= 0) {
                continue;
            }
            $type = $this->type($typeId);
            $variantId = (int)($arLink['id'] ?? $arLink['variant_id'] ?? 0);

            if ($variantId > 0) {
                $variant = $this->property($variantId, $arLink);
                if (false === $type->getProperties()->contains($variant)) {
                    $type->addProperty($variant);
                }
                $kept[$variant->getId().':'.$typeId] = true;
                continue;
            }

            foreach ($type->getProperties() as $linkedProperty) {
                if (!$this->propertyLinkMatches($linkedProperty, $prototype, $arLink)) {
                    continue;
                }
                $this->property($linkedProperty, $arLink);
                $kept[$linkedProperty->getId().':'.$typeId] = true;
                continue 2;
            }

            $variant = $this->createPropertyVariantForType($prototype, $type, $arLink);
            $kept[$variant->getId().':'.$typeId] = true;
        }

        foreach ($existing as $key => $data) {
            if (isset($kept[$key])) {
                continue;
            }
            $data['type']->removeProperty($data['variant']);
            if (0 === $data['variant']->getTypes()->count()) {
                $this->getPropertyRepository()->remove($data['variant']);
            }
        }
    }

    private function propertyLinkMatches (Property $linkedProperty, Property $prototype, array $arLink): bool {
        if (null === ($linkedPrototype = $linkedProperty->getPrototype())
            || (int)$linkedPrototype->getId() !== (int)$prototype->getId()) {
            return false;
        }
        $parentId = (int)($arLink['parent_property_id'] ?? $arLink['parent_id'] ?? 0);
        $linkedParentId = (int)($linkedProperty->getParent()?->getId() ?? 0);

        return $parentId === $linkedParentId;
    }

    private function createPropertyVariantForType (Property $prototype, Type $type, array $arLink = []): Property {
        $payload = [
            'prototype_id' => $prototype->getId(),
            'code' => $prototype->getCode(),
            'name' => $prototype->getName(),
            'active' => array_key_exists('active', $arLink) ? (bool)$arLink['active'] : $prototype->isActive(),
            'required' => array_key_exists('required', $arLink) ? (bool)$arLink['required'] : $prototype->isRequired(),
            'multiple' => array_key_exists('multiple', $arLink) ? (bool)$arLink['multiple'] : $prototype->isMultiple(),
            'sort' => array_key_exists('sort', $arLink) ? (int)$arLink['sort'] : (int)$prototype->getSort(),
            'fieldType' => $prototype->getFieldType(),
            'listType' => $prototype->getListType(),
            'postfix' => $prototype->getPostfix(),
            'defaultValue' => $prototype->getDefaultValue(),
        ];
        $parentId = (int)($arLink['parent_property_id'] ?? $arLink['parent_id'] ?? 0);
        if ($parentId > 0) {
            $payload['parent_id'] = $parentId;
        }
        $variant = $this->property(null, $payload);
        $type->addProperty($variant);

        return $variant;
    }

    public function buildPropertyLinks (Property $property, TypeRepository $typeRepository): array {
        $links = [];
        if (null !== $property->getPrototype()) {
            return $links;
        }

        foreach ($typeRepository->findBy(['property' => $property], ['sort' => 'ASC', 'name' => 'ASC']) as $type) {
            $links['root_'.$type->getId()] = [
                'id' => 0,
                'variant_id' => null,
                'type_id' => $type->getId(),
                'type_kind' => 'component',
                'link_kind' => 'root',
                'type_name' => $type->getName(),
                'type_code' => $type->getCode(),
                'property_name' => $property->getName(),
                'property_code' => $property->getCode(),
                'parent_property_id' => null,
                'parent_property_name' => null,
                'active' => $type->isActive(),
                'required' => false,
                'multiple' => false,
                'readonly' => true,
            ];
        }

        foreach ($this->getPropertyRepository()->findBy(['prototype' => $property], ['sort' => 'ASC', 'name' => 'ASC']) as $variant) {
            foreach ($variant->getTypes() as $type) {
                $parent = $variant->getParent();
                $key = $variant->getId().'_'.$type->getId();
                $links[$key] = [
                    'id' => $variant->getId(),
                    'variant_id' => $variant->getId(),
                    'type_id' => $type->getId(),
                    'type_kind' => null !== $type->getProperty() ? 'component' : 'device',
                    'link_kind' => 'property',
                    'type_name' => $type->getName(),
                    'type_code' => $type->getCode(),
                    'property_name' => $variant->getName(),
                    'property_code' => $variant->getCode(),
                    'parent_property_id' => $parent?->getId(),
                    'parent_property_name' => $parent?->getName(),
                    'active' => $variant->isActive(),
                    'required' => $variant->isRequired(),
                    'multiple' => $variant->isMultiple(),
                    'readonly' => false,
                ];
            }
        }

        return $links;
    }

    private function splitEnumPayloads (array $incoming): array {
        $byId = [];
        $new = [];
        foreach ($incoming as $payload) {
            if (!is_array($payload)) {
                continue;
            }
            $id = (int)($payload['id'] ?? 0);
            if ($id > 0) {
                $byId[$id] = $payload;
            } else {
                $new[] = $payload;
            }
        }
        return [$byId, $new];
    }

    private function syncPropertyVariants (Property $prototype): void {
        if (!(int)$prototype->getId()) {
            return;
        }
        foreach ($this->getPropertyRepository()->findBy(['prototype' => $prototype]) as $variant) {
            $variant->setFieldType($prototype->getFieldType());
            $variant->setPostfix($prototype->getPostfix());
            $variant->setListType($prototype->getListType());
        }
    }

    private function detachEnumFromDevices (PropertyEnum $enum): void {
        $query = $this->getEntityManager()->createQuery(
            'SELECT dp FROM '.Device\Property::class.' dp JOIN dp.valueL e WHERE e = :enum'
        )->setParameter('enum', $enum);
        foreach ($query->execute() as $deviceProperty) {
            $deviceProperty->removeValueL($enum);
        }
    }

    /**
     * @param Property[] $properties
     */
    private function syncDevicesForProperties (array $properties): void {
        $propertyIds = [];
        foreach ($properties as $property) {
            if (!($property instanceof Property) || !(int)$property->getId()) {
                continue;
            }
            $propertyIds[] = (int)$property->getId();
            if (null != ($prototype = $property->getPrototype())) {
                $propertyIds[] = (int)$prototype->getId();
            }
            foreach ($this->getPropertyRepository()->findBy(['prototype' => $property]) as $variant) {
                $propertyIds[] = (int)$variant->getId();
            }
        }
        $propertyIds = array_values(array_unique(array_filter($propertyIds)));
        if (empty($propertyIds)) {
            return;
        }

        $query = $this->getEntityManager()->createQuery(
            'SELECT dp FROM '.Device\Property::class.' dp WHERE dp.property IN (:properties)'
        )->setParameter('properties', $propertyIds);
        foreach ($query->execute() as $deviceProperty) {
            $this->syncDevicePropertyValues($deviceProperty);
        }
    }

    private function syncDevicePropertyValues (Device\Property $deviceProperty): void {
        $property = $deviceProperty->getProperty();
        if (!($property instanceof Property) || $property->getFieldType() !== 'L') {
            return;
        }

        $validEnums = [];
        foreach ($property->getEnums() as $enum) {
            $validEnums[(int)$enum->getId()] = $enum;
        }

        foreach ($deviceProperty->getValueL() as $enum) {
            if (!isset($validEnums[(int)$enum->getId()])) {
                $deviceProperty->removeValueL($enum);
            }
        }

        if ($deviceProperty->getValueL()->count() === 0) {
            foreach ($validEnums as $enum) {
                if ($enum->getDefault()) {
                    $deviceProperty->addValueL($enum);
                    if (!$property->isMultiple()) {
                        break;
                    }
                }
            }
        }
    }

    private function syncDevicesForType (Type $type): void {
        $properties = [];
        $propertyIds = [];
        foreach ($type->getProperties() as $property) {
            $properties[] = $property;
            $propertyIds[(int)$property->getId()] = true;
        }
        if (empty($properties)) {
            return;
        }

        foreach ($this->getDeviceRepository()->findBy(['type' => $type]) as $device) {
            foreach ($device->getProperties()->toArray() as $deviceProperty) {
                if (null !== $deviceProperty->getSubDevice()) {
                    continue;
                }
                $baseId = (int)$deviceProperty->getProperty()->getId();
                if (!isset($propertyIds[$baseId])) {
                    $device->removeProperty($deviceProperty);
                    $this->getEntityManager()->remove($deviceProperty);
                }
            }

            $existing = [];
            foreach ($device->getProperties() as $deviceProperty) {
                $existing[(int)$deviceProperty->getProperty()->getId()] = true;
            }
            foreach ($properties as $property) {
                $baseId = (int)$property->getId();
                if (isset($existing[$baseId])) {
                    continue;
                }
                $this->getEntityManager()->persist($deviceProperty = $device->newProperty($property));
                $this->applyDefaultDevicePropertyValues($deviceProperty);
            }
        }

        $this->syncDevicesForProperties($properties);
    }

    private function applyDefaultDevicePropertyValues (Device\Property $deviceProperty): void {
        $property = $deviceProperty->getProperty();
        if (!($property instanceof Property)) {
            return;
        }
        if ($property->getFieldType() === 'L') {
            foreach ($property->getEnums() as $enum) {
                if ($enum->getDefault()) {
                    $deviceProperty->addValueL($enum);
                    if (!$property->isMultiple()) {
                        break;
                    }
                }
            }
            return;
        }
        if (null !== $property->getDefaultValue() && '' !== $property->getDefaultValue()) {
            $deviceProperty->setValue($property->getDefaultValue());
        }
    }

    private function normalizePropertyPayloads (?array $properties): array {
        if (empty($properties)) {
            return [];
        }
        if (!array_is_list($properties)) {
            return $properties;
        }
        $normalized = [];
        foreach ($properties as $index => $payload) {
            if (!is_array($payload)) {
                continue;
            }
            $id = (int)($payload['id'] ?? 0);
            $normalized[$id > 0 ? $id : 'new_'.$index] = $payload;
        }
        return $normalized;
    }

    private function consumePropertyPayload (array &$properties, int $propertyId): ?array {
        if ($propertyId <= 0) {
            return null;
        }
        foreach ([$propertyId, (string)$propertyId] as $key) {
            if (isset($properties[$key]) && is_array($properties[$key])) {
                $payload = $properties[$key];
                unset($properties[$key]);
                return $payload;
            }
        }
        foreach ($properties as $key => $payload) {
            if (!is_array($payload)) {
                continue;
            }
            if ((int)($payload['id'] ?? 0) === $propertyId) {
                unset($properties[$key]);
                return $payload;
            }
        }
        return null;
    }

    public function component (mixed $component = null, ?array $arComponent = null): Property {
        if (is_int($component) && $component > 0) {
            $component = $this->getPropertyRepository()->find($component);
        } elseif (is_array($component)) {
            $component = $this->getPropertyRepository()->findOneBy($component);
        }
        if (!($component instanceof Property)) {
            $component = new Property();
        }
        if (empty($arComponent)) {
            return $component;
        }

        if (array_key_exists('active', $arComponent)) {
            $component->setActive((bool)$arComponent['active']);
        }
        if (array_key_exists('code', $arComponent)) {
            $component->setCode((string)$arComponent['code']);
        }
        if (array_key_exists('name', $arComponent)) {
            $component->setName((string)$arComponent['name']);
        }
        if (array_key_exists('sort', $arComponent)) {
            $component->setSort((int)$arComponent['sort'] ?: 100);
        }
        if (array_key_exists('type', $arComponent) && $arComponent['type'] instanceof Type) {
            $component->setType($arComponent['type']);
        } elseif (array_key_exists('type_id', $arComponent) && (int)$arComponent['type_id'] > 0) {
            $component->setType($this->type((int)$arComponent['type_id']));
        } else {
            $this->type($component->getType(), array(
                'property' => $component
            ), false);
        }
        $errors = $this->getValidator()->validate($component);
        if (count($errors) > 0) {
            throw new ValidationFailedException($arComponent, $errors);
        }
        $this->getPropertyRepository()->save($component, true);

        if (empty($arComponent['children'])) {
            $arComponent['children'] = [];
        }
        foreach ($component->getChildren() as $property) {
            if ($arProperty = $arComponent['children'][$property->getId()] ?? null) {
                $arProperty['sort'] = ($arProperty['sort'] % $component->getSort()) + $component->getSort();
                $this->property($property, $arProperty);
            } else {
                $component->removeChild($property);
                $this->getPropertyRepository()->remove($property);
            }
            unset($arComponent['children'][$property->getId()]);
        }
        foreach ($arComponent['children'] as $arProperty) {
            $arProperty['sort'] = ($arProperty['sort'] % $component->getSort()) + $component->getSort();
            $component->addChild($this->property(null, $arProperty));
        }

        $this->getEntityManager()->flush();

        return $component;
    }

    protected function joinToProperty (mixed $property, mixed $prototype): void {
        if (!($property instanceof Property)) {
            $property = $this->property($property);
        }
        if (!($prototype instanceof Property)) {
            $prototype = $prototype? $this->property($prototype): null;
        }
        $oldPrototype = $property->getPrototype();
        if ($oldPrototype && $prototype && $oldPrototype->getId() != $prototype->getId()) {
            foreach ($oldPrototype->getEnums() as $enum) {
                $this->getEntityManager()->persist($newEnum = $property->newEnum()
                    ->setSort($enum->getSort())
                    ->setName($enum->getName())
                    ->setValue($enum->getValue())
                    ->setDefault($enum->getDefault()));

                $query = $this->getEntityManager()->createQuery('SELECT dp FROM '.Device\Property::class.' dp JOIN dp.valueL dpe WHERE dp.property = :property AND dpe = :enum')
                    ->setParameters(array(
                        'property' => $property->getId(),
                        'enum' => $enum->getId()
                    ));

                foreach ($query->execute() as $dp) {
                    $dp->removeValueL($enum)->addValueL($newEnum);
                }
            }
        }

        if ($property && $prototype) {
            $values = array();
            foreach ($prototype->getEnums() as $enum) {
                $values[$enum->getValue()] = $enum;
            }
            foreach ($property->getEnums() as $enum) {
                if (!empty($values[$enum->getValue()])) {
                    $values[$enum->getValue()]
                        ->setSort($enum->getSort())
                        ->setName($enum->getName())
                        ->setDefault($enum->getDefault());

                    $query = $this->getEntityManager()->createQuery('SELECT dp FROM ' . Device\Property::class . ' dp JOIN dp.valueL dpe  WHERE dp.property = :property AND dpe = :enum')
                        ->setParameters(array(
                            'property' => $property->getId(),
                            'enum' => $enum->getId()
                        ));

                    foreach ($query->execute() as $dp) {
                        $dp->removeValueL($enum)->addValueL($values[$enum->getValue()]);
                    }

                    $property->removeEnum($enum);
                    $this->getEntityManager()->remove($enum);
                } else {
                    $enum->setProperty($prototype);
                }
            }
            $i = 0; $def = true;
            foreach ($prototype->getEnums() as $enum) {
                if ($def && $enum->getDefault()) {
                    $enum->setDefault(true);
                    $def = false;
                } else {
                    $enum->setDefault(false);
                }
                $enum->setSort($i++);
            }
        }
        $property->setPrototype($prototype);
    }
    public function propertyJoinPrototype (mixed $property, mixed $prototype): void {
        if (!($property instanceof Property)) {
            $property = $this->property($property);
        }
        if (!($prototype instanceof Property)) {
            $prototype = $prototype? $this->property($prototype): null;
        }
        $oldPrototype = $property->getPrototype();

        // Unlink: copy enum values from shared property onto this one.
        if ($oldPrototype && (null === $prototype || $oldPrototype->getId() != $prototype->getId())) {
            if (null === $prototype && $property->getEnums(false)->count() === 0) {
                foreach ($oldPrototype->getEnums(false) as $enum) {
                    $this->getEntityManager()->persist($property->newEnum()
                        ->setSort($enum->getSort())
                        ->setName($enum->getName(false))
                        ->setValue($enum->getValue())
                        ->setDefault($enum->getDefault()));
                }
            }
        }

        // Link: enums stay on the prototype property; do not move them here.
        $property->setPrototype($prototype);
    }

    public function getPropertyValue (Property|DeviceProperty $property, $id = null): array|null {
        return $this->propertyValueSerializer->serialize($property, $id);
    }

    protected function logHistory (Device $device, ?Device $parent = null) {
        if (null != ($history = $this->getEntityManager()->getRepository(Device\History::class)->findOneBy(array(
                'device' => $device,
                'execute' => null
            ), array(
                'datePlacement' => "DESC"
            )))) {
            $history->setExecute(new \DateTime());
            $device->addLog(sprintf('Изъята из #%s "%s"', $history->getParent()->getId(), $history->getParent()->getCode()));
            $history->getParent()->addLog(sprintf('Изъята "%s" #%s "%s" sn - %s', $device->getType()->getName(), $device->getId(), $device->getName(), $device->getSn()));
        }
        if ($parent instanceof Device) {
            $this->getEntityManager()->persist($device->newHistory($parent));
            $device->addLog(sprintf('Вставлено в #%s "%s"', $parent->getId(),  $parent->getCode()));
            $parent->addLog(sprintf('Добавлена "%s" #%s "%s" sn - %s', $device->getType()->getName(), $device->getId(), $device->getName(), $device->getSn()));
        }
    }
    protected function logRepair (Device $device, Device\Repair $repair) {
        if ($repair->isClosed()) {
            $device->addLog(sprintf("Забрали из ремонта %s (%s) по причине - %s\n\t\t сделано - %s", $repair->getReceivedFrom("Y.m.d"), $repair->getRepairman(), $repair->getReason(), $repair->getDescription()));
        } else {
            $device->addLog(sprintf('Сдали в ремонт %s (%s) причина - %s', $repair->getPutInto("Y.m.d"), $repair->getRepairman(), $repair->getReason()));
        }
    }
    protected function logLocation (Device $device, Device\Location $location) {
        $device->addLog(sprintf('%s - перемещен %s', $location->getDate("Y.m.d"), $location->getPlace()));
    }
    protected function logAccounting (Accounting $accounting) {
        if ($accounting->isDiscarded() && $accounting->getDevice()) {
            $accounting->getDevice()->addLog(sprintf('%s - списан', $accounting->getDateDiscarded("Y.m.d")));
        }
    }



    public function device (mixed $device = null, ?array $arDevice = null) {
        if (is_int($device) && $device > 0) {
            $device = $this->getEntityManager()->find(Device::class, $device);
        } elseif (is_array($device)) {
            $device = $this->getEntityManager()->getRepository(Device::class)->findOneBy($device);
        }
        if (!($device instanceof Device)) {
            $device = new Device();
        }
        if (empty($arDevice)) {
            return $device;
        }

        if (!$arDevice['name']) {
            //$arDevice['name'] = $arDevice['code'];
        }

        if (!(int)$device->getId() && $arDevice['name'] != $device->getName()) {
            $device->addLog(sprintf('Название "%s" -> "%s"', $device->getName(), $arDevice['name']));
        }
        if (!(int)$device->getId() && ($arDevice['code']??'') != $device->getCode(false)) {
            $device->addLog(sprintf('Изменен код "%s" -> "%s"', $device->getName(), ($device->getType()? $device->getType()->getPrefix(): '').$arDevice['code']));
        }

        if (array_key_exists('name', $arDevice)) {
            $device->setName($arDevice['name']);
        }
        if (array_key_exists('sn', $arDevice)) {
            $device->setSn($arDevice['sn']);
        }
        if (array_key_exists('code', $arDevice)) {
            $device->setCode($arDevice['code']);
        }
        if (array_key_exists('sort', $arDevice)) {
            $device->setSort($arDevice['sort']);
        }
        if (array_key_exists('description', $arDevice)) {
            $device->setDescription($arDevice['description']);
        }

        if ($arDevice['type']??null instanceof Type) {
            $device->setType($arDevice['type']);
        } elseif ((int)($arDevice['type_id']??0) > 0) {
            $device->setType($this->type((int)$arDevice['type_id']));
        }

        if ($arDevice['parent']??null instanceof Device) {
            $device->setParent($arDevice['parent']);
        } elseif ((int)($arDevice['parent_id']??0) > 0) {
            $device->setParent($this->device((int)$arDevice['parent_id']));
        }

        $this->getDeviceRepository()->save($device, true);

        $arProperties = $arDevice['properties']??[];
        foreach ($device->getProperties() as $deviceProperty) {
            $subDevice = $deviceProperty->getSubDevice() ?? null;
            if ($arProperty = $arProperties[$deviceProperty->getId()]) {
                if (null != $subDevice) {
                    $deviceProperty->setValue($arProperty['value']);
                    if ($arSubProperties = $arProperty['properties']) {
                        $subDevice = $this->device($subDevice, array(
                            'name' => $arProperty['value'],
                            'properties' => $arSubProperties
                        ));
                    }
                } elseif ("L" == $deviceProperty->getProperty()->getFieldType()) {
                    $arProperty['valueL'] = (array)$arProperty['valueL']??[];
                    foreach ($deviceProperty->getValueL() as $enum) {
                        if (!in_array($enum->getId(), $arProperty['valueL'])) {
                            $deviceProperty->removeValueL($enum);
                        } else {
                            if (false !== ($key = array_search($enum->getId(), $arProperty['valueL']))) {
                                unset($arProperty['valueL'][$key]);
                            }
                        }
                    }
                    foreach ($arProperty['valueL'] as $val) {
                        $deviceProperty->addValueL($this->getPropertyEnumRepository()->find((int)$val));
                    }
                    $deviceProperty->setValue($arProperty['value']);
                    $deviceProperty->setValueS($arProperty['valueS']);
                    $deviceProperty->setValueN($arProperty['valueN']);
                } else {
                    $deviceProperty->setValue($arProperty['value']);
                }
                unset($arProperties[$deviceProperty->getId()]);
            } else {
                $device->removeProperty($deviceProperty);
                $this->getEntityManager()->remove($deviceProperty);
                if (null != $subDevice) {
                    $device->removeChild($subDevice);
                    $this->logHistory($subDevice, null);
                }
            }
        }
        foreach ($arProperties as $arProperty) {
            $property = $this->property((int)$arProperty['property_id']);
            //$deviceProperty = $device->newProperty($property);
            $this->getEntityManager()->persist($deviceProperty = $device->newProperty($property));

            if (!empty($arProperty['properties'])) {
                if (!empty($arProperty['sn'])) {
                    if (!($subDevice = $this->getDeviceRepository()->findOneBy(array(
                        'type' => $property->getType(),
                        'sn' => $arProperty['sn']
                    )))) {
                        $subDevice = new Device;
                    }
                } else {
                    $subDevice = new Device;
                }

                $this->device($subDevice, array(
                    'sn' => $arProperty['sn'] ?: $subDevice->getSn(),
                    'name' => $arProperty['value'],
                    'type' => $property->getType(),
                    'properties' => !empty($arProperties)? $arProperties: $arProperty['properties'],
                    'parent' => $device,
                ));

                $this->logHistory($subDevice, $device);

                $deviceProperty
                    ->setValue($subDevice->getName())
                    ->setSubDevice($subDevice);
            } elseif ("L" == $property->getFieldType()) {
                $arProperty['valueL'] = (array)$arProperty['valueL'];
                foreach ($arProperty['valueL'] as $val) {
                    $enum = $this->getEntityManager()->find(PropertyEnum::class, (int)$val);
                    $deviceProperty->addValueL($enum);
                }
            } else {
                $deviceProperty->setValue($arProperty['value']);
            }
        }

        if (null != $device->getParent()) {
            if ($deviceProperty = $this->getDevicePropertyRepository()->findOneBy(array(
                'device' => $device->getParent(),
                'subDevice' => $device,
                'property' => $device->getType()->getProperty()
            ))) {
                $deviceProperty->setValue($device->getName());
            }
        }

        $this->getDeviceRepository()->save($device, true);

        return $device;
    }
    public function deviceParent ($subDevice, $device = null) {
        $device = isset($device)? $this->device($device): null;
        if (!($subDevice = $this->device($subDevice))) {
            return;
        }
        if (!($property = $subDevice->getType()->getProperty())) {
            return;
        }

        $subDevice->setParent($device);

        if ($device) {
            $this->getEntityManager()->persist($deviceProperty = $device->newProperty($property)
                ->setValue($subDevice->getName())
                ->setSubDevice($subDevice));
        } else {
            $subDeviceProperty = $this->getEntityManager()->getRepository(Device\Property::class)->findOneBy(array(
                'subDevice' => $subDevice,
                'property' => $property
            ));
            if ($subDeviceProperty) {
                $this->getEntityManager()->remove($subDeviceProperty);
            }
        }

        $this->logHistory($subDevice, $device);
    }
    public function deviceRepair ($device, $arRepair) {
        $device = $this->device($device);
        if (!($repair = $this->getEntityManager()->find(Device\Repair::class, (int)$arRepair['id']))) {
            $repair = $device->newRepair();
            $repair->setPutInto(new \DateTime($arRepair['putInto'] ?: 'now'));
        }
        $oldClosed = $repair->getClosed();
        if ($arRepair['receivedFrom']) {
            $repair->setReceivedFrom(new \DateTime($arRepair['receivedFrom'] ?: 'now'));
        }
        if ($arRepair['reason']) {
            $repair->setReason($arRepair['reason']);
        }
        if ($arRepair['repairman']) {
            $repair->setRepairman($arRepair['repairman']);
        }
        if ($arRepair['description']) {
            $repair->setDescription($arRepair['description']);
        }
        if (!(int)$repair->getId()) {
            $this->getEntityManager()->persist($repair);
            $this->logRepair($device, $repair);
        }
        if ($oldClosed != $repair->getClosed()) {
            $this->logRepair($device, $repair);
        }
        $this->getEntityManager()->flush();
    }
    public function deviceLocation ($device, $arLocation) {
        $device = $this->device($device);
        if ($arLocation['place'] && $arLocation['responsible']) {
            $this->getEntityManager()->persist($location = $device->newLocation()
                ->setDate(new \DateTime($arLocation['date'] ?: 'now'))
                ->setPlace($arLocation['place'])
                ->setResponsible($arLocation['responsible']));
            $this->logLocation($device, $location);
        }
        $this->getEntityManager()->flush();
    }
    public function deviceLicense ($device, $arLicense) {
        $device = $this->device($device);

        $repositoryLicenseKey = $this->getEntityManager()->getRepository(License\Key::class);
        $repositoryLicenseSoftware = $this->getEntityManager()->getRepository(License\Software::class);

        switch (strtoupper($arLicense['licenseType']??'')) {
            case 'OEM':
                $this->lm->oem($arLicense['key'], (int)$arLicense['software'], $device);
                break;
            case 'RTL':
                $this->lm->rtl($arLicense['key'], (int)$arLicense['software'], $device);
                break;
            default:
                $this->getEntityManager()->persist(
                    $device->newLicense($repositoryLicenseSoftware->find((int)$arLicense['licenseSoftware']))
                        ->setKey($repositoryLicenseKey->find((int)$arLicense['key']))
                );
                break;
        }
        $this->getEntityManager()->flush();
    }

    public function accounting ($accounting = null, $arAccounting = null) {
        if (is_int($accounting) && $accounting > 0) {
            $accounting = $this->getAccountingRepository()->find($accounting);
        } elseif (is_array($accounting)) {
            $accounting = $this->getAccountingRepository()->findOneBy($accounting);
        }
        if (!($accounting instanceof Accounting)) {
            $accounting = new Accounting();
        }
        if (empty($arAccounting)) {
            return $accounting;
        }

        if (array_key_exists('inNo', $arAccounting)) {
            $accounting->setInNo($arAccounting['inNo']);
        }
        if (array_key_exists('invoice', $arAccounting)) {
            $accounting->setInvoice($arAccounting['invoice']);
        }
		if (array_key_exists('discarded', $arAccounting)) {
            $accounting->setDiscarded((bool)$arAccounting['discarded']);
            if (!(bool)$arAccounting['discarded']) {
                $accounting->setDateDiscarded(null);
            }
        }
        if (array_key_exists('name', $arAccounting)) {
            $accounting->setName($arAccounting['name']);
        }
        if (array_key_exists('dateInvoice', $arAccounting)) {
            $accounting->setDateInvoice($arAccounting['dateInvoice']? new \DateTime($arAccounting['dateInvoice']): null);
        }
        if (array_key_exists('dateDiscarded', $arAccounting)) {
            if (!empty($arAccounting['dateDiscarded'])) {
                $accounting->setDateDiscarded(new \DateTime($arAccounting['dateDiscarded']));
            } else {
                $accounting->setDateDiscarded(null);
                if (!array_key_exists('discarded', $arAccounting)) {
                    $accounting->setDiscarded(false);
                }
            }
        }
        if ($arAccounting['device']??null instanceof Device) {
            $accounting->setDevice($arAccounting['device']);
        } elseif ((int)($arAccounting['device_id']??0) > 0) {
            $accounting->setDevice($this->device((int)$arAccounting['device_id']));
        }
        if ($arAccounting['parent']??null instanceof Accounting) {
            $accounting->setParent($arAccounting['parent']);
        } elseif ((int)($arAccounting['parent_id']??0) > 0) {
            $accounting->setParent($this->accounting((int)$arAccounting['parent_id']));
        } elseif (($arAccounting['parent_id']??0) === 'detach') {
            $accounting->setParent(null);
        }

        $accounting->setDateDiscarded($accounting->getDateDiscarded(null, false));

        $this->logAccounting($accounting);

        $this->getAccountingRepository()->save($accounting, true);
        return $accounting;
    }
}