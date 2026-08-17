<?php

namespace Board\Enum;

enum MemberRole: string
{
    case Admin = 'admin';
    case Editor = 'editor';
    case Observer = 'observer';

    public function level(): int
    {
        return match ($this) {
            self::Observer => 0,
            self::Editor => 1,
            self::Admin => 2,
        };
    }

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
