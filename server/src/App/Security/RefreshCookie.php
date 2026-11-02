<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\Cookie;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class RefreshCookie
{
    public const DESKTOP = 'xos_refresh';
    public const APP = 'xos_app_refresh';

    public function nameForPath(string $path): string
    {
        if (1 === preg_match('#^/api/(IncCom|calendar|schooltask)/#', $path)) {
            return self::APP;
        }

        return self::DESKTOP;
    }

    public function read(Request $request): ?string
    {
        $value = $request->cookies->get($this->nameForPath($request->getPathInfo()));

        return is_string($value) && '' !== $value ? $value : null;
    }

    public function attach(Response $response, Request $request, string $token): void
    {
        $response->headers->setCookie($this->cookie($request, $token, time() + 7200));
    }

    public function clear(Response $response, Request $request): void
    {
        $response->headers->setCookie($this->cookie($request, '', 1));
    }

    private function cookie(Request $request, string $value, int $expire): Cookie
    {
        return Cookie::create(
            $this->nameForPath($request->getPathInfo()),
            $value,
            $expire,
            '/',
            null,
            $request->isSecure(),
            true,
            false,
            Cookie::SAMESITE_LAX,
        );
    }
}
