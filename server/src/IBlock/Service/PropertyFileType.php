<?php

namespace IBlock\Service;

use Main\Entity\File as MainFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Restriction for property field_type=F (`file_type` column).
 *
 * Empty — any file.
 * `image` — images only (mime image/* or common extensions).
 * Comma/space list of extensions — e.g. `jpg, png, pdf`.
 * Mime / accept fragment with `/` — e.g. `image/*`, `application/pdf`.
 */
final class PropertyFileType
{
    private const IMAGE_EXTENSIONS = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif', 'heic', 'heif',
    ];

    public static function normalize(?string $raw): ?string
    {
        if (null === $raw) {
            return null;
        }
        $trimmed = trim($raw);

        return '' === $trimmed ? null : $trimmed;
    }

    public static function assertAllowed(?string $fileType, MainFile $file): void
    {
        if (self::isAllowed($fileType, $file)) {
            return;
        }
        throw new BadRequestHttpException(sprintf(
            'File #%d does not match property file_type=%s',
            (int) $file->getId(),
            self::normalize($fileType) ?? '',
        ));
    }

    public static function isAllowed(?string $fileType, MainFile $file): bool
    {
        $rule = self::normalize($fileType);
        if (null === $rule) {
            return true;
        }

        $mime = strtolower((string) $file->getContentType());
        $ext = self::extensionOf($file);

        $lower = strtolower($rule);
        if ('image' === $lower) {
            return str_starts_with($mime, 'image/')
                || (null !== $ext && \in_array($ext, self::IMAGE_EXTENSIONS, true));
        }

        if (str_contains($rule, '/')) {
            return self::mimeMatches($rule, $mime);
        }

        $allowed = self::parseExtensions($rule);
        if ([] === $allowed) {
            return true;
        }

        return null !== $ext && \in_array($ext, $allowed, true);
    }

    /** HTML FileButton `accept` value, or null for any. */
    public static function toAcceptAttr(?string $fileType): ?string
    {
        $rule = self::normalize($fileType);
        if (null === $rule) {
            return null;
        }
        $lower = strtolower($rule);
        if ('image' === $lower) {
            return 'image/*';
        }
        if (str_contains($rule, '/')) {
            return $rule;
        }
        $parts = [];
        foreach (self::parseExtensions($rule) as $ext) {
            $parts[] = '.'.$ext;
        }

        return [] === $parts ? null : implode(',', $parts);
    }

    private static function extensionOf(MainFile $file): ?string
    {
        $name = (string) $file->getOriginalName();
        if ('' === $name) {
            $name = (string) $file->getFileName();
        }
        $pos = strrpos($name, '.');
        if (false === $pos || $pos === \strlen($name) - 1) {
            return null;
        }

        return strtolower(substr($name, $pos + 1));
    }

    /** @return list<string> */
    private static function parseExtensions(string $rule): array
    {
        $parts = preg_split('/[\s,;]+/', strtolower($rule)) ?: [];
        $out = [];
        foreach ($parts as $part) {
            $part = ltrim(trim($part), '.');
            if ('' !== $part) {
                $out[] = $part;
            }
        }

        return array_values(array_unique($out));
    }

    private static function mimeMatches(string $pattern, string $mime): bool
    {
        $pattern = strtolower(trim($pattern));
        if ($pattern === $mime) {
            return true;
        }
        if (str_ends_with($pattern, '/*')) {
            $prefix = substr($pattern, 0, -1);

            return str_starts_with($mime, $prefix);
        }

        return false;
    }
}
