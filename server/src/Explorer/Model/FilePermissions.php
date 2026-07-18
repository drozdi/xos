<?php

namespace Explorer\Model;

final class FilePermissions
{
    public const READ = 1;
    public const WRITE = 2;
    public const EXECUTE = 4;
    public const DELETE = 8;
    public const ALL = self::READ | self::WRITE | self::EXECUTE | self::DELETE;

    public static function has(int $mask, int $flag): bool
    {
        return ($mask & $flag) === $flag;
    }

    /**
     * @return list<string>
     */
    public static function toList(int $mask): array
    {
        $list = [];
        if (self::has($mask, self::READ)) {
            $list[] = 'read';
        }
        if (self::has($mask, self::WRITE)) {
            $list[] = 'write';
        }
        if (self::has($mask, self::EXECUTE)) {
            $list[] = 'execute';
        }
        if (self::has($mask, self::DELETE)) {
            $list[] = 'delete';
        }

        return $list;
    }

    public static function fromNames(array $names): int
    {
        $mask = 0;
        foreach ($names as $name) {
            $mask |= match ($name) {
                'read' => self::READ,
                'write' => self::WRITE,
                'execute' => self::EXECUTE,
                'delete' => self::DELETE,
                default => 0,
            };
        }

        return $mask;
    }
}
