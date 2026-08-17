<?php

namespace Pkb\Service;

use Main\Entity\User;
use Pkb\Entity\Vault;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class VaultPathResolver
{
    public function assertOwner(Vault $vault, User $user): void
    {
        if ($vault->getOwner()?->getId() !== $user->getId()) {
            throw new AccessDeniedHttpException('Нет доступа к vault');
        }
    }

    public function toExplorerUri(Vault $vault, string $relativePath = ''): string
    {
        $root = rtrim($vault->getRootPath(), '/');
        $relative = $this->normalizeRelativePath($relativePath);

        if ('' === $relative) {
            return $root.'/';
        }

        return $root.'/'.$relative;
    }

    public function normalizeRelativePath(string $path): string
    {
        $path = str_replace('\\', '/', trim($path));
        $path = trim($path, '/');

        if ('' !== $path && (str_contains($path, '..') || str_starts_with($path, '/'))) {
            throw new BadRequestHttpException('Недопустимый путь');
        }

        foreach (explode('/', $path) as $segment) {
            if ('..' === $segment || '.' === $segment) {
                throw new BadRequestHttpException('Недопустимый путь');
            }
        }

        return $path;
    }

    public function assertWithinVault(Vault $vault, string $relativePath): string
    {
        return $this->normalizeRelativePath($relativePath);
    }
}
