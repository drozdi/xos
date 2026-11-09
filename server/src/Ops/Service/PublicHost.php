<?php

namespace Ops\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Same public-host rule as saved SSH connections. */
final class PublicHost
{
    public static function assert(mixed $value): string
    {
        $host = trim((string) $value);
        if (str_starts_with($host, '[') && str_ends_with($host, ']')) {
            $host = substr($host, 1, -1);
        }
        $isIp = false !== filter_var($host, FILTER_VALIDATE_IP);
        $isName = 1 === preg_match('/^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/', $host);
        if (!$isIp && !$isName) {
            throw new BadRequestHttpException('Хост заполнен неверно');
        }
        if (self::isPrivate($host, $isIp)) {
            throw new BadRequestHttpException('Хост во внутренней сети недоступен');
        }

        return $host;
    }

    private static function isPrivate(string $host, bool $isIp): bool
    {
        $lower = strtolower($host);
        if (\in_array($lower, ['localhost', 'metadata.google.internal'], true)
            || str_ends_with($lower, '.local')
            || str_ends_with($lower, '.internal')) {
            return true;
        }
        if ($isIp) {
            return false === filter_var($host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
        }
        $records = @gethostbynamel($host);
        if (!\is_array($records)) {
            return false;
        }
        foreach ($records as $ip) {
            if (false === filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return true;
            }
        }

        return false;
    }
}
