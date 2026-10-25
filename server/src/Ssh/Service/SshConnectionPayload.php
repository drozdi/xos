<?php

namespace Ssh\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Normalizes a saved-connection write payload. */
final class SshConnectionPayload
{
    /**
     * @param array<string, mixed> $data
     *
     * @return array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     auth: 'password'|'key',
     *     secret: string|null,
     *     passphrase: string|null,
     *     passphraseProvided: bool,
     *     keyId: int|null,
     *     keyIdProvided: bool
     * }
     */
    public static function parse(array $data, bool $isNew): array
    {
        $name = self::text($data['name'] ?? null, 'Название', 120);
        $host = self::host($data['host'] ?? null);
        $port = self::port($data['port'] ?? 22);
        $username = self::username($data['username'] ?? null);
        $auth = self::auth($data['auth'] ?? null);

        $secretProvided = array_key_exists('secret', $data) && null !== $data['secret'] && '' !== trim((string) $data['secret']);
        $secret = $secretProvided ? (string) $data['secret'] : null;
        $keyIdProvided = array_key_exists('key_id', $data);
        $keyId = self::keyId($keyIdProvided ? $data['key_id'] : null);
        if ($isNew && 'password' === $auth && null === $secret) {
            throw new BadRequestHttpException('Укажите пароль');
        }
        if ($isNew && 'key' === $auth && null === $keyId && null === $secret) {
            throw new BadRequestHttpException('Выберите ключ');
        }
        if (null !== $secret) {
            self::assertSecret($auth, $secret);
        }

        $passphraseProvided = array_key_exists('passphrase', $data);
        $passphrase = null;
        if ($passphraseProvided) {
            if (null === $data['passphrase']) {
                $passphrase = null;
            } else {
                $passphrase = (string) $data['passphrase'];
                if (strlen($passphrase) > 1024) {
                    throw new BadRequestHttpException('Парольная фраза слишком длинная');
                }
            }
        }

        return [
            'name' => $name,
            'host' => $host,
            'port' => $port,
            'username' => $username,
            'auth' => $auth,
            'secret' => $secret,
            'passphrase' => $passphrase,
            'passphraseProvided' => $passphraseProvided,
            'keyId' => $keyId,
            'keyIdProvided' => $keyIdProvided,
        ];
    }

    private static function text(mixed $value, string $label, int $max): string
    {
        $text = trim((string) $value);
        if ('' === $text || strlen($text) > $max || preg_match('/[\x00-\x1F]/', $text)) {
            throw new BadRequestHttpException($label.' заполнено неверно');
        }

        return $text;
    }

    private static function host(mixed $value): string
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

        return $host;
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

    private static function username(mixed $value): string
    {
        $username = trim((string) $value);
        if ('' === $username || strlen($username) > 128 || preg_match('/[\s\x00-\x1F]/', $username)) {
            throw new BadRequestHttpException('Пользователь заполнен неверно');
        }

        return $username;
    }

    private static function keyId(mixed $value): ?int
    {
        if (null === $value || '' === $value) {
            return null;
        }
        if (!is_int($value) && !(is_string($value) && ctype_digit($value))) {
            throw new BadRequestHttpException('Ключ заполнен неверно');
        }
        $id = (int) $value;
        if ($id < 1) {
            throw new BadRequestHttpException('Ключ заполнен неверно');
        }

        return $id;
    }

    /**
     * @return 'password'|'key'
     */
    private static function auth(mixed $value): string
    {
        if ('password' === $value || 'key' === $value) {
            return $value;
        }

        throw new BadRequestHttpException('Тип входа заполнен неверно');
    }

    /**
     * @param 'password'|'key' $auth
     */
    private static function assertSecret(string $auth, string $secret): void
    {
        if ('password' === $auth) {
            if (strlen($secret) > 1024 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $secret)) {
                throw new BadRequestHttpException('Пароль заполнен неверно');
            }

            return;
        }

        if (strlen($secret) > 100_000 || !str_contains($secret, 'PRIVATE KEY')) {
            throw new BadRequestHttpException('Приватный ключ заполнен неверно');
        }
    }
}
