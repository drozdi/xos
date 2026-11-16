<?php

namespace Rdp\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Normalizes a saved RDP connection. Host policy is applied by the manager. */
final class RdpConnectionPayload
{
    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    public static function parse(array $data, bool $isNew): array
    {
        $secret = self::secret($data, $isNew);

        return [
            'name' => self::text($data['name'] ?? null, 'Название', 120),
            'host' => self::text($data['host'] ?? null, 'Хост', 253),
            'port' => self::port($data['port'] ?? 3389),
            'zone' => self::enum($data['zone'] ?? 'auto', ['auto', 'public', 'internal'], 'Зона'),
            'username' => self::text($data['username'] ?? null, 'Пользователь', 128),
            'domain' => self::optional($data['domain'] ?? '', 128),
            'secret' => $secret,
            'security' => self::enum($data['security'] ?? 'nla', ['any', 'nla', 'tls', 'rdp'], 'Безопасность'),
            'ignore_cert' => self::bool($data['ignore_cert'] ?? false),
            'width' => self::dimension($data['width'] ?? 1280, 4096),
            'height' => self::dimension($data['height'] ?? 720, 2160),
            'dpi' => self::dimension($data['dpi'] ?? 96, 400, 48),
            'color_depth' => self::enumInt($data['color_depth'] ?? 16, [8, 16, 24, 32]),
            'enable_clipboard' => self::bool($data['enable_clipboard'] ?? true),
            'enable_audio' => self::bool($data['enable_audio'] ?? false),
            'enable_drive' => self::bool($data['enable_drive'] ?? false),
            'keyboard_layout' => self::layout($data['keyboard_layout'] ?? 'en-us-qwerty'),
            'resize_method' => self::enum($data['resize_method'] ?? 'reconnect', ['display-update', 'reconnect'], 'Размер'),
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function secret(array $data, bool $required): ?string
    {
        if (!array_key_exists('secret', $data) || null === $data['secret'] || '' === $data['secret']) {
            if ($required) {
                throw new BadRequestHttpException('Укажите пароль');
            }

            return null;
        }
        $secret = (string) $data['secret'];
        if (strlen($secret) > 1024 || 1 === preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $secret)) {
            throw new BadRequestHttpException('Пароль заполнен неверно');
        }

        return $secret;
    }

    private static function text(mixed $value, string $label, int $max): string
    {
        $text = trim((string) $value);
        if ('' === $text || strlen($text) > $max || 1 === preg_match('/[\x00-\x1F]/', $text)) {
            throw new BadRequestHttpException($label.' заполнено неверно');
        }

        return $text;
    }

    private static function optional(mixed $value, int $max): string
    {
        $text = trim((string) $value);
        if (strlen($text) > $max || 1 === preg_match('/[\x00-\x1F]/', $text)) {
            throw new BadRequestHttpException('Домен заполнен неверно');
        }

        return $text;
    }

    private static function port(mixed $value): int
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

    private static function dimension(mixed $value, int $max, int $min = 0): int
    {
        if (!is_int($value) && !(is_string($value) && ctype_digit((string) $value))) {
            throw new BadRequestHttpException('Размер заполнен неверно');
        }
        $number = (int) $value;
        if ($number < $min || $number > $max) {
            throw new BadRequestHttpException('Размер заполнен неверно');
        }

        return $number;
    }

    /**
     * @param list<string> $allowed
     */
    private static function enum(mixed $value, array $allowed, string $label): string
    {
        if (!is_string($value) || !in_array($value, $allowed, true)) {
            throw new BadRequestHttpException($label.' заполнено неверно');
        }

        return $value;
    }

    /**
     * @param list<int> $allowed
     */
    private static function enumInt(mixed $value, array $allowed): int
    {
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException('Глубина цвета заполнена неверно');
        }
        $number = (int) $value;
        if (!in_array($number, $allowed, true)) {
            throw new BadRequestHttpException('Глубина цвета заполнена неверно');
        }

        return $number;
    }

    private static function layout(mixed $value): string
    {
        $text = trim((string) $value);
        if (1 !== preg_match('/^[a-z0-9-]{2,32}$/', $text)) {
            throw new BadRequestHttpException('Раскладка заполнена неверно');
        }

        return $text;
    }

    private static function bool(mixed $value): bool
    {
        return true === $value || 1 === $value || '1' === $value || 'true' === $value;
    }
}
