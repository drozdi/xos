<?php

namespace Ops\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Host reached by the remote SSH server, not by this machine. */
final class TunnelTarget
{
    public static function host(mixed $value): string
    {
        $host = trim((string) $value);
        $isIp = false !== filter_var($host, FILTER_VALIDATE_IP);
        $isName = 1 === preg_match('/^(?=.{1,253}$)[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?$/', $host);
        if ((!$isIp && !$isName) || str_starts_with($host, '-') || str_contains($host, ':')) {
            throw new BadRequestHttpException('Адрес назначения заполнен неверно');
        }

        return $host;
    }

    public static function listenPort(mixed $value): int
    {
        $port = self::port($value);
        if ($port < 1024) {
            throw new BadRequestHttpException('Порт слушателя должен быть от 1024');
        }

        return $port;
    }

    public static function port(mixed $value): int
    {
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException('Порт заполнен неверно');
        }
        $port = (int) $value;
        if ($port < 1 || $port > 65535) {
            throw new BadRequestHttpException('Порт заполнен неверно');
        }

        return $port;
    }
}
