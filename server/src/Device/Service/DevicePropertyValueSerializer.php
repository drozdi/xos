<?php

namespace Device\Service;

use Device\Entity\Device\Property as DeviceProperty;
use Device\Entity\Property;

class DevicePropertyValueSerializer
{
    public function serialize(Property|DeviceProperty $property, mixed $id = null): ?array
    {
        $eValue = null;
        if ($property instanceof DeviceProperty) {
            $eValue = $property;
            $property = $eValue->getProperty();
        }
        $isDef = !($eValue instanceof DeviceProperty);

        if ($isDef) {
            $id = $id ?? 'prop_'.mt_rand(10, 20);
            $valueS = $property->getDefaultValue();
            $valueN = $property->getDefaultValue();
            $valueL = $property->isMultiple() ? [] : null;
            $value = $property->getFieldType() === 'L' ? $valueL : $property->getDefaultValue();
        } else {
            $id = $eValue->getId();
            $value = $eValue->getValue();
            $valueS = $eValue->getValueS();
            $valueN = $eValue->getValueN();
            $valueL = array_map(static function ($enum) {
                return $enum->getId();
            }, $eValue->getValueL()->toArray());
            $valueL = !$property->isMultiple() && count($valueL) > 0 ? $valueL[0] : $valueL;
        }
        $enums = [];
        foreach ($property->getEnums() as $enum) {
            if ($isDef && $enum->isDefault() && $property->isMultiple()) {
                $valueL[] = $enum->getId();
                if ($property->getFieldType() === 'L') {
                    $value[] = $enum->getName();
                }
            } elseif ($isDef && $enum->isDefault()) {
                $valueL = $enum->getId();
                $value = $enum->getName();
            }
            $enums[$enum->getId()] = [
                'id' => $enum->getId(),
                'code' => $enum->getCode(),
                'name' => $enum->getName(),
                'sort' => $enum->getSort(),
                'default' => $enum->isDefault(),
            ];
        }

        if ($isDef && $property->getFieldType() === 'L' && $property->isMultiple()) {
            $valueS = $value = implode(', ', $value);
        } elseif ($isDef && $property->getFieldType() === 'L' && $property->isMultiple()) {
            $valueS = $value;
        } elseif ($isDef && $property->getFieldType() === 'N') {
            $value = $valueS = (string) $valueN;
        }

        return [
            'id' => $id,
            'value' => $value,
            'valueL' => $valueL,
            'valueS' => $valueS,
            'valueN' => $valueN,
            'property_id' => $property->getId(),
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
            'enums' => $enums,
        ];
    }
}
