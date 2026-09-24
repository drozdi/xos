<?php

namespace IBlock\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\File as MainFile;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Serialize / resolve main_file refs for preview_image / detail_image.
 */
final class IblockImageRef
{
    /** @return array{id: int, name: string, src: string}|null */
    public static function serialize(?MainFile $file): ?array
    {
        if (!$file instanceof MainFile || null === $file->getId()) {
            return null;
        }

        return [
            'id' => (int) $file->getId(),
            'name' => (string) $file->getOriginalName(),
            'src' => (string) $file->getFileSRC(),
        ];
    }

    /**
     * Accepts null, int id, numeric string, or {id: int}.
     */
    public static function extractId(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (is_array($value) && array_key_exists('id', $value)) {
            $value = $value['id'];
        }
        if (is_numeric($value)) {
            $id = (int) $value;

            return $id > 0 ? $id : null;
        }

        return null;
    }

    public static function resolve(EntityManagerInterface $em, mixed $raw): ?MainFile
    {
        $fileId = self::extractId($raw);
        if (null === $fileId) {
            return null;
        }
        $file = $em->find(MainFile::class, $fileId);
        if (!$file instanceof MainFile) {
            throw new BadRequestHttpException(sprintf('File #%d not found', $fileId));
        }

        return $file;
    }

    /**
     * Apply preview_image / detail_image from request fields onto an entity with setters.
     *
     * @param object{setPreviewImage(?MainFile): mixed, setDetailImage(?MainFile): mixed} $entity
     * @param array<string, mixed>                                                         $fields
     */
    public static function applyTo(object $entity, array $fields, EntityManagerInterface $em): void
    {
        if (array_key_exists('preview_image_id', $fields) || array_key_exists('preview_image', $fields)) {
            $raw = $fields['preview_image_id'] ?? $fields['preview_image'] ?? null;
            $entity->setPreviewImage(self::resolve($em, $raw));
        }
        if (array_key_exists('detail_image_id', $fields) || array_key_exists('detail_image', $fields)) {
            $raw = $fields['detail_image_id'] ?? $fields['detail_image'] ?? null;
            $entity->setDetailImage(self::resolve($em, $raw));
        }
    }
}
