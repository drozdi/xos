<?php

namespace IBlock\Service;

use IBlock\Entity\Property;

/**
 * Pure helpers for iblock element prototype / property value handling.
 */
class ElementPrototypeHelper
{
    public function extractId(mixed $item): ?int
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

    public function isListFieldType(string $fieldType): bool
    {
        return 'L' === strtoupper($fieldType);
    }

    public function isPrototypeFieldType(string $fieldType): bool
    {
        return 'P' === strtoupper($fieldType);
    }

    public function fieldIsFilled(mixed $value): bool
    {
        if (null === $value || '' === $value) {
            return false;
        }
        if (!\is_array($value)) {
            return true;
        }
        if ([] === $value) {
            return false;
        }
        if (!array_is_list($value)) {
            return true;
        }
        foreach ($value as $item) {
            if (null !== $item && '' !== $item && [] !== $item) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param array<string, mixed> $tuple
     * @param list<Property>       $children
     */
    public function tupleHasValue(array $tuple, array $children): bool
    {
        foreach ($children as $child) {
            $childCode = (string) $child->getCode();
            if ($this->fieldIsFilled($tuple[$childCode] ?? null)) {
                return true;
            }
        }

        return false;
    }
}
