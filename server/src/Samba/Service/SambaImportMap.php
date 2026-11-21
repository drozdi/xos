<?php

namespace Samba\Service;

/** Правила полей main → атрибуты домена. Имя учётки всегда login, имя группы всегда code. */
final class SambaImportMap
{
    /** @var list<string> */
    public const USER_FIELDS = ['login', 'first_name', 'second_name', 'patronymic', 'alias', 'email', 'phone', 'description'];

    /** @var list<string> */
    public const GROUP_FIELDS = ['code', 'name', 'description'];

    /** @var list<string> */
    public const ATTRIBUTES = [
        'givenName',
        'sn',
        'displayName',
        'description',
        'mail',
        'telephoneNumber',
        'title',
        'department',
        'company',
        'physicalDeliveryOfficeName',
        'homeDirectory',
        'homeDrive',
        'scriptPath',
        'profilePath',
    ];

    /**
     * @return array{user: array<string, string>, group: array<string, string>}
     */
    public static function defaults(): array
    {
        return [
            'user' => [
                'givenName' => 'first_name',
                'sn' => 'second_name',
                'displayName' => 'alias',
                'mail' => 'email',
                'telephoneNumber' => 'phone',
                'description' => 'description',
            ],
            'group' => [
                'description' => 'description',
            ],
        ];
    }

    /**
     * @param array<string, mixed> $raw
     *
     * @return array{user: array<string, string>, group: array<string, string>}
     */
    public static function normalize(array $raw): array
    {
        return [
            'user' => self::side($raw['user'] ?? null, self::USER_FIELDS),
            'group' => self::side($raw['group'] ?? null, self::GROUP_FIELDS),
        ];
    }

    /**
     * @param list<string> $fields
     *
     * @return array<string, string>
     */
    private static function side(mixed $raw, array $fields): array
    {
        if (!is_array($raw)) {
            $raw = [];
        }
        $map = [];
        foreach (self::ATTRIBUTES as $attribute) {
            $source = trim((string) ($raw[$attribute] ?? ''));
            if ('' === $source || !in_array($source, $fields, true)) {
                continue;
            }
            $map[$attribute] = $source;
        }

        return $map;
    }
}
