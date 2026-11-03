<?php

namespace Board\Service;

use Board\Entity\Board;
use Board\Enum\MemberRole;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/**
 * Pure input normalization / parsing for board write paths.
 */
class BoardInputNormalizer
{
    public function normalizeName(mixed $name): string
    {
        $value = trim((string) ($name ?? ''));

        return '' !== $value ? $value : 'Без названия';
    }

    public function normalizeTitle(mixed $title): string
    {
        $value = trim((string) ($title ?? ''));

        return '' !== $value ? $value : 'Без названия';
    }

    public function normalizeNullableText(mixed $value): ?string
    {
        if (null === $value) {
            return null;
        }
        $text = trim((string) $value);

        return '' !== $text ? $text : null;
    }

    public function parseFilterDate(?string $value): ?\DateTimeInterface
    {
        if (null === $value || '' === trim($value)) {
            return null;
        }

        try {
            return new \DateTimeImmutable(trim($value));
        } catch (\Exception) {
            throw new BadRequestHttpException('Некорректная дата фильтра');
        }
    }

    public function normalizeBackgroundType(mixed $type): string
    {
        $value = strtolower(trim((string) $type));
        if (!in_array($value, [Board::BACKGROUND_COLOR, Board::BACKGROUND_IMAGE, Board::BACKGROUND_GRADIENT], true)) {
            throw new BadRequestHttpException('background_type: color, image или gradient');
        }

        return $value;
    }

    public function normalizeVisibility(mixed $visibility): string
    {
        $value = strtolower(trim((string) $visibility));
        if (!in_array($value, [Board::VISIBILITY_PRIVATE, Board::VISIBILITY_WORKSPACE], true)) {
            throw new BadRequestHttpException('visibility: private или workspace');
        }

        return $value;
    }

    public function parseMemberRole(string $role): MemberRole
    {
        $parsed = MemberRole::tryFromString($role);
        if (null === $parsed) {
            throw new BadRequestHttpException('role: admin, editor или observer');
        }

        return $parsed;
    }

    public function normalizeCardTitle(mixed $title): string
    {
        $value = trim((string) ($title ?? ''));

        return '' !== $value ? $value : 'Без названия';
    }

    public function normalizeLabelName(mixed $name): string
    {
        $value = trim((string) ($name ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите name метки');
        }

        return $value;
    }

    public function normalizeLabelColor(mixed $color): string
    {
        $value = trim((string) ($color ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите color метки');
        }

        return $value;
    }

    public function parseNullableDateTime(mixed $value): ?\DateTimeInterface
    {
        if (null === $value || '' === $value) {
            return null;
        }
        try {
            return new \DateTime((string) $value);
        } catch (\Exception) {
            throw new BadRequestHttpException('Некорректный due_date');
        }
    }

    public function formatDateTime(?\DateTimeInterface $dateTime): ?string
    {
        return $dateTime?->format('Y-m-d\TH:i:s');
    }

    public function normalizeChecklistTitle(mixed $title): string
    {
        $value = trim((string) ($title ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите title чеклиста');
        }

        return $value;
    }

    public function normalizeChecklistItemText(mixed $text): string
    {
        $value = trim((string) ($text ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите text пункта');
        }

        return $value;
    }

    public function normalizeCommentText(mixed $text): string
    {
        $value = trim((string) ($text ?? ''));
        if ('' === $value) {
            throw new BadRequestHttpException('Укажите text комментария');
        }

        return $value;
    }
}
