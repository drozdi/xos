<?php

namespace App\Security;

final class ProtectedAppModules
{
    /** @var list<string> */
    public const MODULES = [
        'main',
        'device',
        'explorer',
        'schooltask',
        'inccom',
        'calendar',
        'board',
        'pkb',
    ];

    public static function isProtected(string $module): bool
    {
        return in_array(strtolower($module), self::MODULES, true);
    }

    /**
     * @return list<string>
     */
    public static function all(): array
    {
        return self::MODULES;
    }
}
