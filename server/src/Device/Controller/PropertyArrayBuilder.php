<?php

namespace Device\Controller;

use Device\Entity\Property;

final class PropertyArrayBuilder {
    public static function fromProperty (Property $property): array {
        $enums = [];
        foreach ($property->getEnums() as $enum) {
            $enums[$enum->getId()] = [
                'id' => $enum->getId(),
                'value' => $enum->getValue(),
                'name' => $enum->getName(false),
                'sort' => $enum->getSort(),
                'default' => $enum->getDefault(),
            ];
        }

        return [
            'id' => $property->getId(),
            'active' => $property->isActive(),
            'required' => $property->isRequired(),
            'multiple' => $property->isMultiple(),
            'code' => $property->getCode(),
            'name' => $property->getName(),
            'sort' => $property->getSort(),
            'fieldType' => $property->getFieldType(),
            'listType' => $property->getListType(),
            'postfix' => $property->getPostfix(),
            'defaultValue' => $property->getDefaultValue(),
            'prototype_id' => $property->getPrototype()?->getId(),
            'enums' => $enums,
        ];
    }
}
