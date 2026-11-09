<?php

namespace Ops\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class DockerEndpoint
{
    public static function origin(mixed $value): string
    {
        $raw = trim((string) $value);
        $parts = parse_url($raw);
        if (!\is_array($parts) || !isset($parts['scheme'], $parts['host'])) {
            throw new BadRequestHttpException('Адрес заполнен неверно');
        }
        $scheme = strtolower((string) $parts['scheme']);
        if (!\in_array($scheme, ['http', 'https'], true)) {
            throw new BadRequestHttpException('Адрес заполнен неверно');
        }
        if (isset($parts['user']) || isset($parts['pass']) || isset($parts['query']) || isset($parts['fragment'])) {
            throw new BadRequestHttpException('Адрес заполнен неверно');
        }
        $path = (string) ($parts['path'] ?? '');
        if ('' !== $path && '/' !== $path) {
            throw new BadRequestHttpException('Укажите адрес без пути');
        }
        $host = PublicHost::assert($parts['host']);
        $port = isset($parts['port']) ? (int) $parts['port'] : ('https' === $scheme ? 443 : 80);
        if ($port < 1 || $port > 65535) {
            throw new BadRequestHttpException('Порт заполнен неверно');
        }
        $printed = str_contains($host, ':') ? '['.$host.']' : $host;

        return $scheme.'://'.$printed.':'.$port;
    }
}
