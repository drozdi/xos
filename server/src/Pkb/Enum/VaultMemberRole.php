<?php

namespace Pkb\Enum;

enum VaultMemberRole: string
{
    case Reader = 'reader';
    case Editor = 'editor';

    public static function tryFromString(string $value): ?self
    {
        return self::tryFrom(strtolower(trim($value)));
    }

    /**
     * @return string[]
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
