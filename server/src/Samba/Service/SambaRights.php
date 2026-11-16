<?php

namespace Samba\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Grantable server rights. The command log is never a grant. */
final class SambaRights
{
    public const VIEW = 1;
    public const SHARES = 2;
    public const DIRECTORY = 4;
    public const PROVISION = 8;
    public const MANAGE = 16;

    public const ALL = self::VIEW | self::SHARES | self::DIRECTORY | self::PROVISION | self::MANAGE;

    /**
     * @param list<string>|int $value
     */
    public static function parse(mixed $value): int
    {
        if (is_int($value)) {
            if ($value < 1 || ($value & ~self::ALL) !== 0) {
                throw new BadRequestHttpException('Права заполнены неверно');
            }

            return $value;
        }
        if (!is_array($value) || [] === $value) {
            throw new BadRequestHttpException('Укажите права');
        }
        $mask = 0;
        foreach ($value as $name) {
            if (!is_string($name)) {
                throw new BadRequestHttpException('Права заполнены неверно');
            }
            if ('log' === $name || 'transfer' === $name) {
                throw new BadRequestHttpException('Это право нельзя выдать');
            }
            $bit = match ($name) {
                'view' => self::VIEW,
                'shares' => self::SHARES,
                'directory' => self::DIRECTORY,
                'provision' => self::PROVISION,
                'manage' => self::MANAGE,
                default => throw new BadRequestHttpException('Права заполнены неверно'),
            };
            $mask |= $bit;
        }

        return $mask;
    }

    /**
     * @return list<string>
     */
    public static function names(int $mask): array
    {
        $names = [];
        foreach ([
            'view' => self::VIEW,
            'shares' => self::SHARES,
            'directory' => self::DIRECTORY,
            'provision' => self::PROVISION,
            'manage' => self::MANAGE,
        ] as $name => $bit) {
            if (($mask & $bit) === $bit) {
                $names[] = $name;
            }
        }

        return $names;
    }

    public static function has(int $mask, int $bit): bool
    {
        return ($mask & $bit) === $bit;
    }
}
