<?php

namespace Xos\Agent;

/** Whitelisted operations. Anything else is rejected before a process starts. */
final class Executor
{
    /** @var list<string> */
    public const ALLOWED = [
        'state.read',
        'service.restart',
        'domain.provision',
        'domain.info',
        'directory.read',
        'user.ensure',
        'user.set_password',
        'user.disable',
        'user.enable',
        'user.delete',
        'group.ensure',
        'group.members',
        'object.read',
        'object.write',
        'object.move',
        'ou.ensure',
        'dns.read',
        'shares.read',
        'shares.apply',
        'share.remove',
        'testparm',
        'smbstatus.brief',
    ];

    /** @var list<string> */
    private const WRITABLE = [
        'givenName',
        'sn',
        'displayName',
        'description',
        'mail',
        'telephoneNumber',
        'title',
        'department',
        'company',
        'physicalDeliveryOfficeName',
        'homeDirectory',
        'homeDrive',
        'scriptPath',
        'profilePath',
    ];

    public function __construct(private readonly Config $config)
    {
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    public function run(array $command): array
    {
        $type = (string) ($command['type'] ?? '');
        if (!in_array($type, self::ALLOWED, true)) {
            return ['status' => 'rejected', 'result' => 'Операция не из белого списка'];
        }
        if ('state.read' === $type) {
            return ['status' => 'succeeded', 'result' => $this->encode($this->state())];
        }
        if ('domain.provision' === $type && !$this->config->allowProvision) {
            return ['status' => 'rejected', 'result' => 'Provision запрещён локальными настройками'];
        }
        if ('directory.read' === $type) {
            return $this->directory();
        }
        if ('object.read' === $type) {
            return $this->objectRead($command);
        }
        if ('object.write' === $type) {
            return $this->objectWrite($command);
        }
        if ('object.move' === $type) {
            return $this->objectMove($command);
        }
        $domain = [
            'ou.ensure',
            'ou.delete',
            'user.ensure',
            'user.disable',
            'user.enable',
            'user.delete',
            'user.set_password',
            'group.ensure',
            'group.delete',
            'group.members',
        ];
        if (in_array($type, $domain, true)) {
            return $this->mutate($type, $command);
        }
        if (in_array($type, ['shares.read', 'shares.apply', 'share.remove'], true)) {
            return (new Shares($this->config))->run($command);
        }

        return ['status' => 'rejected', 'result' => 'Операция будет исполняться на следующей фазе'];
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    private function objectRead(array $command): array
    {
        $kind = (string) ($command['args']['kind'] ?? '');
        $name = $this->token($command['args']['name'] ?? null);
        if (!in_array($kind, ['user', 'group', 'ou'], true) || null === $name) {
            return ['status' => 'rejected', 'result' => 'Запись указана неверно'];
        }
        try {
            $text = $this->objectText($kind, $name);
        } catch (\RuntimeException $error) {
            return ['status' => 'failed', 'result' => $error->getMessage()];
        }
        $record = $this->parseLdif($text);
        $record['kind'] = $kind;
        $record['name'] = $name;

        return ['status' => 'succeeded', 'result' => $this->encode($record)];
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    private function objectWrite(array $command): array
    {
        $kind = (string) ($command['args']['kind'] ?? '');
        $name = $this->token($command['args']['name'] ?? null);
        $attributes = is_array($command['args']['attributes'] ?? null) ? $command['args']['attributes'] : [];
        if (!in_array($kind, ['user', 'group', 'ou'], true) || null === $name || [] === $attributes) {
            return ['status' => 'rejected', 'result' => 'Запись указана неверно'];
        }
        if (!is_file($this->config->ldbmodify)) {
            return ['status' => 'failed', 'result' => 'ldbmodify не найден'];
        }
        try {
            $record = $this->parseLdif($this->objectText($kind, $name));
        } catch (\RuntimeException $error) {
            return ['status' => 'failed', 'result' => $error->getMessage()];
        }
        if ('' === $record['dn']) {
            return ['status' => 'failed', 'result' => 'DN записи не найден'];
        }
        $ldif = "dn: ".$record['dn']."\nchangetype: modify\n";
        foreach ($attributes as $key => $value) {
            if (!is_string($key) || !in_array($key, self::WRITABLE, true) || !is_string($value)) {
                return ['status' => 'rejected', 'result' => 'Атрибут не из белого списка'];
            }
            if (str_contains($value, "\n") || str_contains($value, "\r")) {
                return ['status' => 'rejected', 'result' => 'Значение заполнено неверно'];
            }
            if ('' === $value) {
                $ldif .= "delete: {$key}\n-\n";
                continue;
            }
            $ldif .= "replace: {$key}\n{$key}:: ".base64_encode($value)."\n-\n";
        }
        $ran = $this->runProcess($this->config->ldbmodify, ['-H', $this->config->samLdb], $ldif);

        return ['status' => 0 === $ran['code'] ? 'succeeded' : 'failed', 'result' => $ran['text']];
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    private function objectMove(array $command): array
    {
        $kind = (string) ($command['args']['kind'] ?? '');
        $name = $this->token($command['args']['name'] ?? null);
        $parent = $this->token($command['args']['parent'] ?? null, 512);
        if (!in_array($kind, ['user', 'group', 'ou'], true) || null === $name || null === $parent) {
            return ['status' => 'rejected', 'result' => 'Перенос указан неверно'];
        }
        $tool = match ($kind) {
            'user' => ['user', 'move', $name, $parent],
            'group' => ['group', 'move', $name, $parent],
            'ou' => ['ou', 'move', $name, $parent],
        };
        $ran = $this->runTool($tool);

        return ['status' => 0 === $ran['code'] ? 'succeeded' : 'failed', 'result' => $ran['text']];
    }

    private function objectText(string $kind, string $name): string
    {
        if ('ou' === $kind) {
            if (!is_file($this->config->ldbsearch)) {
                throw new \RuntimeException('ldbsearch не найден');
            }
            $ran = $this->runProcess($this->config->ldbsearch, ['-H', $this->config->samLdb, '-b', $this->ouDn($name), '-s', 'base'], null);
        } else {
            $ran = $this->runTool([$kind, 'show', $name]);
        }
        if (0 !== $ran['code']) {
            throw new \RuntimeException('' !== $ran['text'] ? $ran['text'] : 'Запись не прочитана');
        }

        return $ran['text'];
    }

    private function ouDn(string $name): string
    {
        if (1 === preg_match('/^OU=/i', $name)) {
            return $name;
        }
        foreach ($this->lines(['ou', 'list']) as $dn) {
            if (0 === strcasecmp($dn, $name)) {
                return $dn;
            }
            if (1 === preg_match('/^OU=([^,]+)/i', $dn, $match) && 0 === strcasecmp($match[1], $name)) {
                return $dn;
            }
        }

        throw new \RuntimeException('Подразделение не найдено');
    }

    /**
     * @return array{dn: string, cn: string, attributes: array<string, list<string>>}
     */
    private function parseLdif(string $text): array
    {
        $dn = '';
        /** @var array<string, list<string>> $attributes */
        $attributes = [];
        $current = null;
        foreach (preg_split('/\R/', $text) ?: [] as $line) {
            if ('' === $line || str_starts_with($line, '#')) {
                $current = null;
                continue;
            }
            if (str_starts_with($line, ' ') && null !== $current && isset($attributes[$current])) {
                $last = count($attributes[$current]) - 1;
                $attributes[$current][$last] .= substr($line, 1);
                continue;
            }
            $parts = explode(':', $line, 2);
            if (2 !== count($parts)) {
                $current = null;
                continue;
            }
            $key = trim($parts[0]);
            $raw = $parts[1];
            $encoded = str_starts_with($raw, ':');
            $value = trim($encoded ? substr($raw, 1) : $raw);
            if ($encoded) {
                $decoded = base64_decode($value, true);
                $value = is_string($decoded) ? $decoded : '';
            }
            if (0 === strcasecmp($key, 'dn')) {
                $dn = $value;
                $current = null;
                continue;
            }
            $attributes[$key][] = $value;
            $current = $key;
        }
        $cn = '';
        foreach ($attributes as $key => $values) {
            if (0 === strcasecmp($key, 'cn') && isset($values[0])) {
                $cn = $values[0];
                break;
            }
        }
        if ('' === $cn && 1 === preg_match('/^(?:CN|OU)=([^,]+)/i', $dn, $match)) {
            $cn = $match[1];
        }

        return ['dn' => $dn, 'cn' => $cn, 'attributes' => $attributes];
    }

    /**
     * @return array<string, mixed>
     */
    public function state(): array
    {
        $timezone = date_default_timezone_get();
        $timedate = $this->timedatectl();

        return [
            'hostname' => php_uname('n'),
            'time_ms' => (int) round(microtime(true) * 1000),
            'timezone' => is_string($timedate['Timezone'] ?? null) ? $timedate['Timezone'] : $timezone,
            'ntp' => isset($timedate['NTPSynchronized']) && 'yes' === $timedate['NTPSynchronized'],
            'php' => PHP_VERSION,
            'samba_tool' => is_file($this->config->sambaTool),
            'smb_conf' => is_file($this->config->smbConf),
            'share_roots' => $this->config->shareRoots,
        ];
    }

    /**
     * @return array{status: string, result: string}
     */
    private function directory(): array
    {
        if (!is_file($this->config->sambaTool)) {
            return ['status' => 'failed', 'result' => 'samba-tool не найден'];
        }
        try {
            $ouLines = $this->lines(['ou', 'list']);
            $userLines = $this->lines(['user', 'list']);
            $groupLines = $this->lines(['group', 'list']);
        } catch (\RuntimeException $error) {
            return ['status' => 'failed', 'result' => $error->getMessage()];
        }
        $users = [];
        foreach (array_slice($userLines, 0, 150) as $name) {
            $dn = '';
            $cn = '';
            $enabled = true;
            try {
                foreach ($this->lines(['user', 'show', $name]) as $line) {
                    if (str_starts_with($line, 'dn:')) {
                        $dn = trim(substr($line, 3));
                    }
                    if (str_starts_with($line, 'cn:')) {
                        $cn = trim(substr($line, 3));
                    }
                    if (str_starts_with($line, 'userAccountControl:')) {
                        $enabled = (intval(trim(substr($line, strlen('userAccountControl:')))) & 2) === 0;
                    }
                }
            } catch (\RuntimeException) {
            }
            $users[] = ['name' => $name, 'cn' => '' !== $cn ? $cn : $name, 'dn' => $dn, 'enabled' => $enabled];
        }
        $groups = [];
        foreach (array_slice($groupLines, 0, 80) as $name) {
            $members = [];
            try {
                $members = $this->lines(['group', 'listmembers', $name]);
            } catch (\RuntimeException) {
            }
            $dn = '';
            $cn = $name;
            try {
                foreach ($this->lines(['group', 'show', $name]) as $line) {
                    if (str_starts_with($line, 'dn:')) {
                        $dn = trim(substr($line, 3));
                    }
                    if (str_starts_with($line, 'cn:')) {
                        $cn = trim(substr($line, 3));
                    }
                }
            } catch (\RuntimeException) {
            }
            $groups[] = ['name' => $name, 'cn' => $cn, 'dn' => $dn, 'members' => $members];
        }
        $ous = [];
        foreach ($ouLines as $dn) {
            $name = $dn;
            if (1 === preg_match('/^OU=([^,]+)/i', $dn, $match)) {
                $name = $match[1];
            }
            $ous[] = ['dn' => $dn, 'name' => $name, 'cn' => $name];
        }

        return ['status' => 'succeeded', 'result' => $this->encode([
            'ous' => $ous,
            'users' => $users,
            'groups' => $groups,
            'truncated' => count($userLines) > 150 || count($groupLines) > 80,
        ])];
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    private function mutate(string $type, array $command): array
    {
        if (!is_file($this->config->sambaTool)) {
            return ['status' => 'failed', 'result' => 'samba-tool не найден'];
        }
        $args = is_array($command['args'] ?? null) ? $command['args'] : [];
        $name = $this->token($args['name'] ?? null);
        if (null === $name) {
            return ['status' => 'rejected', 'result' => 'Имя заполнено неверно'];
        }
        $password = $this->unseal(isset($command['sealed']) ? (string) $command['sealed'] : '');
        if (('user.ensure' === $type || 'user.set_password' === $type) && null === $password) {
            return ['status' => 'failed', 'result' => 'Пароль не расшифровался'];
        }
        $argv = $this->argv($type, $name, $args, $password);
        if (null === $argv) {
            return ['status' => 'rejected', 'result' => 'Аргументы заполнены неверно'];
        }
        $ran = $this->runTool($argv);
        $text = $ran['text'];
        if (null !== $password && '' !== $password) {
            $text = str_replace($password, '***', $text);
        }
        if (strlen($text) > 200_000) {
            $text = substr($text, 0, 200_000);
        }

        return ['status' => 0 === $ran['code'] ? 'succeeded' : 'failed', 'result' => $text];
    }

    /**
     * @param array<string, mixed> $args
     *
     * @return list<string>|null
     */
    private function argv(string $type, string $name, array $args, ?string $password): ?array
    {
        return match ($type) {
            'ou.ensure' => $this->ouCreate($name, $args),
            'ou.delete' => ['ou', 'delete', $name],
            'user.ensure' => $this->userCreate($name, $args, (string) $password),
            'user.disable' => ['user', 'disable', $name],
            'user.enable' => ['user', 'enable', $name],
            'user.delete' => ['user', 'delete', $name],
            'user.set_password' => ['user', 'setpassword', $name, '--newpassword', (string) $password],
            'group.ensure' => ['group', 'add', $name],
            'group.delete' => ['group', 'delete', $name],
            'group.members' => $this->members($name, $args),
            default => null,
        };
    }

    /**
     * @param array<string, mixed> $args
     *
     * @return list<string>
     */
    private function ouCreate(string $name, array $args): array
    {
        $argv = ['ou', 'create', $name];
        $parent = $this->token($args['parent'] ?? null);
        if (null !== $parent) {
            $argv[] = '--parent-ou';
            $argv[] = $parent;
        }

        return $argv;
    }

    /**
     * @param array<string, mixed> $args
     *
     * @return list<string>
     */
    private function userCreate(string $name, array $args, string $password): array
    {
        $argv = ['user', 'create', $name];
        foreach (['given_name' => '--given-name', 'surname' => '--surname', 'ou' => '--userou'] as $key => $flag) {
            $value = $this->token($args[$key] ?? null);
            if (null !== $value) {
                $argv[] = $flag;
                $argv[] = $value;
            }
        }
        $argv[] = '--password';
        $argv[] = $password;

        return $argv;
    }

    /**
     * @param array<string, mixed> $args
     *
     * @return list<string>|null
     */
    private function members(string $name, array $args): ?array
    {
        $member = $this->token($args['member'] ?? null);
        $action = (string) ($args['action'] ?? '');
        if (null === $member || !in_array($action, ['add', 'remove'], true)) {
            return null;
        }

        return ['group', 'add' === $action ? 'addmembers' : 'removemembers', $name, $member];
    }

    private function token(mixed $value, int $limit = 256): ?string
    {
        $text = trim((string) $value);
        if ('' === $text || str_starts_with($text, '-') || strlen($text) > $limit || 1 === preg_match('/[\x00-\x1F]/', $text)) {
            return null;
        }

        return $text;
    }

    private function unseal(string $sealed): ?string
    {
        if ('' === $sealed || !function_exists('sodium_crypto_box_seal_open')) {
            return null;
        }
        $cipher = base64_decode($sealed, true);
        $secretPath = rtrim($this->config->stateDir, '/\\').'/seal.key';
        $secret = is_file($secretPath) ? file_get_contents($secretPath) : false;
        if (!is_string($cipher) || !is_string($secret) || SODIUM_CRYPTO_BOX_SECRETKEYBYTES !== strlen($secret)) {
            return null;
        }
        $public = sodium_crypto_box_publickey_from_secretkey($secret);
        $keypair = sodium_crypto_box_keypair_from_secretkey_and_publickey($secret, $public);
        $plain = sodium_crypto_box_seal_open($cipher, $keypair);

        return is_string($plain) && '' !== $plain ? $plain : null;
    }

    /**
     * @param list<string> $args
     *
     * @return list<string>
     */
    private function lines(array $args): array
    {
        $ran = $this->runTool($args);
        if (0 !== $ran['code']) {
            throw new \RuntimeException('' !== $ran['text'] ? $ran['text'] : 'samba-tool завершился с ошибкой');
        }
        $rows = [];
        foreach (preg_split('/\R/', $ran['text']) ?: [] as $line) {
            $line = trim($line);
            if ('' !== $line) {
                $rows[] = $line;
            }
        }

        return $rows;
    }

    /**
     * @param list<string> $args
     *
     * @return array{code: int, text: string}
     */
    private function runTool(array $args): array
    {
        $descriptor = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = @proc_open(array_merge([$this->config->sambaTool], $args), $descriptor, $pipes);
        if (!is_resource($process)) {
            return ['code' => 1, 'text' => 'Не удалось запустить samba-tool'];
        }
        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $code = proc_close($process);
        $text = trim((string) $output."\n".(string) $error);
        if (strlen($text) > 200_000) {
            $text = substr($text, 0, 200_000);
        }

        return ['code' => $code, 'text' => $text];
    }

    /**
     * @param list<string> $args
     *
     * @return array{code: int, text: string}
     */
    private function runProcess(string $binary, array $args, ?string $stdin): array
    {
        $descriptor = [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = @proc_open(array_merge([$binary], $args), $descriptor, $pipes);
        if (!is_resource($process)) {
            return ['code' => 1, 'text' => 'Не удалось запустить '.$binary];
        }
        if (null !== $stdin) {
            fwrite($pipes[0], $stdin);
        }
        fclose($pipes[0]);
        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $code = proc_close($process);
        $text = trim((string) $output."\n".(string) $error);
        if (strlen($text) > 200_000) {
            $text = substr($text, 0, 200_000);
        }

        return ['code' => $code, 'text' => $text];
    }

    /**
     * @return array<string, string>
     */
    private function timedatectl(): array
    {
        if (!is_file('/usr/bin/timedatectl')) {
            return [];
        }
        $descriptor = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = @proc_open(['/usr/bin/timedatectl', 'show'], $descriptor, $pipes);
        if (!is_resource($process)) {
            return [];
        }
        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);
        $rows = [];
        foreach (preg_split('/\R/', (string) $output) ?: [] as $line) {
            $parts = explode('=', $line, 2);
            if (2 === count($parts)) {
                $rows[$parts[0]] = $parts[1];
            }
        }

        return $rows;
    }

    /**
     * @param array<string, mixed> $state
     */
    private function encode(array $state): string
    {
        $json = json_encode($state, JSON_UNESCAPED_UNICODE);
        if (!is_string($json)) {
            return '';
        }

        return strlen($json) > 200_000 ? substr($json, 0, 200_000) : $json;
    }
}
