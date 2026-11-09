<?php

namespace Ops\Service;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

/** Normalizes a saved management connection. */
final class OpsLinkPayload
{
    /**
     * @param array<string, mixed> $data
     *
     * @return array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     secret: string|null,
     *     driver: string,
     *     database_name: string,
     *     listen_port: int,
     *     target_host: string,
     *     target_port: int,
     *     ssh_connection_id: int|null
     * }
     */
    public static function parse(string $kind, array $data, bool $isNew): array
    {
        $name = self::text($data['name'] ?? null, 'Название', 120);
        $secret = self::secret($data, $isNew && 'docker' !== $kind && 'tunnel' !== $kind);

        return match ($kind) {
            'db' => self::db($data, $name, $secret, $isNew),
            'docker' => self::docker($data, $name, $secret),
            'vnc' => self::vnc($data, $name, $secret, $isNew),
            'tunnel' => self::tunnel($data, $name),
            default => throw new BadRequestHttpException('Неизвестный тип'),
        };
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     secret: string|null,
     *     driver: string,
     *     database_name: string,
     *     listen_port: int,
     *     target_host: string,
     *     target_port: int,
     *     ssh_connection_id: int|null
     * }
     */
    private static function db(array $data, string $name, ?string $secret, bool $isNew): array
    {
        $driver = $data['driver'] ?? null;
        if ('mysql' !== $driver && 'pgsql' !== $driver) {
            throw new BadRequestHttpException('Драйвер заполнен неверно');
        }
        $port = array_key_exists('port', $data) && '' !== $data['port'] && null !== $data['port']
            ? TunnelTarget::port($data['port'])
            : ('pgsql' === $driver ? 5432 : 3306);
        if ($isNew && null === $secret) {
            throw new BadRequestHttpException('Укажите пароль');
        }

        return self::row(
            $name,
            PublicHost::assert($data['host'] ?? null),
            $port,
            self::text($data['username'] ?? null, 'Пользователь', 128),
            $secret,
            $driver,
            self::database($data['database_name'] ?? null),
            0,
            '',
            0,
            null,
        );
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     secret: string|null,
     *     driver: string,
     *     database_name: string,
     *     listen_port: int,
     *     target_host: string,
     *     target_port: int,
     *     ssh_connection_id: int|null
     * }
     */
    private static function docker(array $data, string $name, ?string $secret): array
    {
        return self::row($name, DockerEndpoint::origin($data['host'] ?? null), 0, '', $secret, '', '', 0, '', 0, null);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     secret: string|null,
     *     driver: string,
     *     database_name: string,
     *     listen_port: int,
     *     target_host: string,
     *     target_port: int,
     *     ssh_connection_id: int|null
     * }
     */
    private static function vnc(array $data, string $name, ?string $secret, bool $isNew): array
    {
        $port = array_key_exists('port', $data) && '' !== $data['port'] && null !== $data['port']
            ? TunnelTarget::port($data['port'])
            : 5900;
        if ($isNew && null === $secret) {
            throw new BadRequestHttpException('Укажите пароль');
        }

        return self::row($name, PublicHost::assert($data['host'] ?? null), $port, '', $secret, '', '', 0, '', 0, null);
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     secret: string|null,
     *     driver: string,
     *     database_name: string,
     *     listen_port: int,
     *     target_host: string,
     *     target_port: int,
     *     ssh_connection_id: int|null
     * }
     */
    private static function tunnel(array $data, string $name): array
    {
        $sshId = $data['ssh_connection_id'] ?? null;
        if (!is_int($sshId) && !(is_string($sshId) && ctype_digit($sshId))) {
            throw new BadRequestHttpException('Подключение SSH не указано');
        }
        $id = (int) $sshId;
        if ($id < 1) {
            throw new BadRequestHttpException('Подключение SSH не указано');
        }

        return self::row(
            $name,
            '',
            0,
            '',
            null,
            '',
            '',
            TunnelTarget::listenPort($data['listen_port'] ?? null),
            TunnelTarget::host($data['target_host'] ?? null),
            TunnelTarget::port($data['target_port'] ?? null),
            $id,
        );
    }

    /**
     * @param array<string, mixed> $data
     */
    private static function secret(array $data, bool $required): ?string
    {
        if (!array_key_exists('secret', $data) || null === $data['secret']) {
            if ($required) {
                throw new BadRequestHttpException('Укажите пароль');
            }

            return null;
        }
        $secret = (string) $data['secret'];
        if ('' === $secret) {
            return $required ? throw new BadRequestHttpException('Укажите пароль') : null;
        }
        if (strlen($secret) > 1024 || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $secret)) {
            throw new BadRequestHttpException('Пароль заполнен неверно');
        }

        return $secret;
    }

    private static function database(mixed $value): string
    {
        $name = trim((string) $value);
        if (1 !== preg_match('/^[A-Za-z0-9_]{1,64}$/', $name)) {
            throw new BadRequestHttpException('База заполнена неверно');
        }

        return $name;
    }

    private static function text(mixed $value, string $label, int $max): string
    {
        $text = trim((string) $value);
        if ('' === $text || strlen($text) > $max || preg_match('/[\x00-\x1F]/', $text)) {
            throw new BadRequestHttpException($label.' заполнено неверно');
        }

        return $text;
    }

    /**
     * @return array{
     *     name: string,
     *     host: string,
     *     port: int,
     *     username: string,
     *     secret: string|null,
     *     driver: string,
     *     database_name: string,
     *     listen_port: int,
     *     target_host: string,
     *     target_port: int,
     *     ssh_connection_id: int|null
     * }
     */
    private static function row(
        string $name,
        string $host,
        int $port,
        string $username,
        ?string $secret,
        string $driver,
        string $database,
        int $listenPort,
        string $targetHost,
        int $targetPort,
        ?int $sshId,
    ): array {
        return [
            'name' => $name,
            'host' => $host,
            'port' => $port,
            'username' => $username,
            'secret' => $secret,
            'driver' => $driver,
            'database_name' => $database,
            'listen_port' => $listenPort,
            'target_host' => $targetHost,
            'target_port' => $targetPort,
            'ssh_connection_id' => $sshId,
        ];
    }
}
