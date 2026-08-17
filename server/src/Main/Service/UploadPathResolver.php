<?php

namespace Main\Service;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class UploadPathResolver
{
    public const ALLOWED_MODULES = ['device', 'common', 'task', 'main', 'board'];

    public function assertAllowedModule(string $module): void
    {
        if (!in_array($module, self::ALLOWED_MODULES, true)) {
            throw new \InvalidArgumentException(sprintf('Upload module "%s" is not allowed', $module));
        }
        if (preg_match('/[\/\\\\]|\.\./', $module)) {
            throw new \InvalidArgumentException('Invalid upload module');
        }
    }

    public function assertSafeSubDir(?string $subDir): void
    {
        if (null === $subDir || '' === $subDir) {
            return;
        }
        if (
            str_contains($subDir, "\0")
            || str_contains($subDir, '..')
            || str_starts_with($subDir, '/')
            || str_starts_with($subDir, '\\')
        ) {
            throw new \InvalidArgumentException('Invalid upload subDir');
        }
    }

    public function resolveReadablePath(string $uploadDir, string $module, string $subDir, string $fileName): string
    {
        $this->assertAllowedModule($module);
        foreach ([$subDir, $fileName] as $segment) {
            if (str_contains($segment, "\0") || str_contains($segment, '..')) {
                throw new NotFoundHttpException('File not found');
            }
        }

        $uploadRoot = realpath($uploadDir);
        if (false === $uploadRoot) {
            throw new NotFoundHttpException('File not found');
        }

        $path = $uploadDir.'/'.$module.'/'.$subDir.'/'.$fileName;
        if (!is_file($path)) {
            throw new NotFoundHttpException('File not found');
        }

        $realPath = realpath($path);
        if (false === $realPath) {
            throw new NotFoundHttpException('File not found');
        }

        $moduleRoot = realpath($uploadDir.'/'.$module);
        if (false === $moduleRoot || !str_starts_with($realPath, $moduleRoot)) {
            throw new NotFoundHttpException('File not found');
        }

        return $realPath;
    }
}
