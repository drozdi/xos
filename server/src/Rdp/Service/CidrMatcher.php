<?php

namespace Rdp\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** IPv4/IPv6 CIDR checks without extra libraries. */
final class CidrMatcher
{
    /** @var list<string> */
    public const DENY = [
        '0.0.0.0/8',
        '127.0.0.0/8',
        '169.254.0.0/16',
        '224.0.0.0/4',
        '240.0.0.0/4',
        '255.255.255.255/32',
        '::/128',
        '::1/128',
        'fe80::/10',
        'ff00::/8',
    ];

    /** @var list<string> */
    public const PRIVATE = [
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
        '100.64.0.0/10',
        'fc00::/7',
    ];

    public static function normalizeIp(string $ip): string
    {
        $ip = strtolower(trim($ip));
        if (str_starts_with($ip, '[') && str_ends_with($ip, ']')) {
            $ip = substr($ip, 1, -1);
        }
        $packed = @inet_pton($ip);
        if (false === $packed) {
            throw new BadRequestHttpException('Адрес заполнен неверно');
        }
        if (16 === strlen($packed) && str_starts_with($packed, "\0\0\0\0\0\0\0\0\0\0\xff\xff")) {
            $mapped = @inet_ntop(substr($packed, 12));
            if (is_string($mapped)) {
                return $mapped;
            }
        }
        $printed = @inet_ntop($packed);

        return is_string($printed) ? $printed : $ip;
    }

    public static function contains(string $cidr, string $ip): bool
    {
        $parts = explode('/', $cidr, 2);
        if (2 !== count($parts)) {
            return false;
        }
        try {
            $ipPacked = inet_pton(self::normalizeIp($ip));
            $netPacked = inet_pton(self::normalizeIp($parts[0]));
        } catch (BadRequestHttpException) {
            return false;
        }
        if (false === $ipPacked || false === $netPacked || strlen($ipPacked) !== strlen($netPacked)) {
            return false;
        }
        $prefix = (int) $parts[1];
        $total = strlen($ipPacked) * 8;
        if ($prefix < 0 || $prefix > $total) {
            return false;
        }
        $full = intdiv($prefix, 8);
        if ($full > 0 && substr($ipPacked, 0, $full) !== substr($netPacked, 0, $full)) {
            return false;
        }
        $rest = $prefix % 8;
        if (0 === $rest) {
            return true;
        }
        $mask = (0xFF << (8 - $rest)) & 0xFF;

        return (ord($ipPacked[$full]) & $mask) === (ord($netPacked[$full]) & $mask);
    }

    /**
     * @param list<string> $extra
     */
    public static function isDenied(string $ip, array $extra = []): bool
    {
        foreach (array_merge(self::DENY, $extra) as $cidr) {
            if (self::contains($cidr, $ip)) {
                return true;
            }
        }

        return false;
    }

    public static function isPrivate(string $ip): bool
    {
        foreach (self::PRIVATE as $cidr) {
            if (self::contains($cidr, $ip)) {
                return true;
            }
        }

        return false;
    }

    public static function prefix(string $cidr): int
    {
        $parts = explode('/', $cidr, 2);

        return 2 === count($parts) ? (int) $parts[1] : 0;
    }

    public static function assertCidr(string $cidr, array $extraDeny = []): string
    {
        $cidr = strtolower(trim($cidr));
        $parts = explode('/', $cidr, 2);
        if (2 !== count($parts) || !ctype_digit($parts[1])) {
            throw new BadRequestHttpException('Сеть заполнена неверно');
        }
        $network = self::normalizeIp($parts[0]);
        $prefix = (int) $parts[1];
        $packed = inet_pton($network);
        if (false === $packed) {
            throw new BadRequestHttpException('Сеть заполнена неверно');
        }
        $max = strlen($packed) * 8;
        $minimum = 4 === strlen($packed) ? 8 : 32;
        if ($prefix < $minimum || $prefix > $max) {
            throw new BadRequestHttpException('Сеть слишком широкая');
        }
        $normalized = $network.'/'.$prefix;
        foreach (array_merge(self::DENY, $extraDeny) as $deny) {
            if (self::overlaps($normalized, $deny)) {
                throw new BadRequestHttpException('Сеть пересекается со служебным диапазоном');
            }
        }

        return $normalized;
    }

    public static function overlaps(string $left, string $right): bool
    {
        $leftParts = explode('/', $left, 2);
        $rightParts = explode('/', $right, 2);
        if (2 !== count($leftParts) || 2 !== count($rightParts)) {
            return false;
        }
        try {
            $leftNet = self::normalizeIp($leftParts[0]);
            $rightNet = self::normalizeIp($rightParts[0]);
        } catch (BadRequestHttpException) {
            return false;
        }
        if (strlen((string) inet_pton($leftNet)) !== strlen((string) inet_pton($rightNet))) {
            return false;
        }
        $leftPrefix = (int) $leftParts[1];
        $rightPrefix = (int) $rightParts[1];
        if ($leftPrefix <= $rightPrefix) {
            return self::contains($leftNet.'/'.$leftPrefix, $rightNet);
        }

        return self::contains($rightNet.'/'.$rightPrefix, $leftNet);
    }
}
