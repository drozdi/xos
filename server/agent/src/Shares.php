<?php

namespace Xos\Agent;

/** Share definitions live in their own file. [global] and sam.ldb stay untouched except one include line. */
final class Shares
{
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
        if ('shares.read' === $type) {
            return ['status' => 'succeeded', 'result' => $this->encode($this->read())];
        }
        if ('share.remove' === $type) {
            return $this->remove($command);
        }
        if ('shares.homes' === $type) {
            return $this->homes($command);
        }
        if ('shares.apply' === $type) {
            return $this->apply($command);
        }

        return ['status' => 'rejected', 'result' => 'Операция не из белого списка'];
    }

    /**
     * @return array{homes: bool, shares: list<array<string, mixed>>}
     */
    private function read(): array
    {
        $shares = [];
        foreach ($this->sections($this->fileText()) as $name => $section) {
            $acl = [];
            foreach ($section['acl'] as $row) {
                $acl[] = $row;
            }
            $shares[] = [
                'name' => $name,
                'path' => $section['values']['path'] ?? '',
                'comment' => $section['values']['comment'] ?? '',
                'guest' => $this->yes($section['values']['guest ok'] ?? ''),
                'enabled' => $this->yes($section['values']['available'] ?? 'yes'),
                'acl' => $acl,
            ];
        }

        return $shares;
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    private function apply(array $command): array
    {
        $args = is_array($command['args'] ?? null) ? $command['args'] : [];
        $name = $this->shareName($args['name'] ?? null);
        $path = $this->sharePath($args['path'] ?? null);
        if (null === $name || null === $path) {
            return ['status' => 'rejected', 'result' => 'Имя или путь шары заполнены неверно'];
        }
        $comment = trim((string) ($args['comment'] ?? ''));
        if (strlen($comment) > 200 || str_contains($comment, "\n") || str_contains($comment, '"')) {
            return ['status' => 'rejected', 'result' => 'Комментарий заполнен неверно'];
        }
        $acl = $this->acl($args['acl'] ?? null);
        if (null === $acl) {
            return ['status' => 'rejected', 'result' => 'Права заполнены неверно'];
        }
        $sections = $this->sections($this->fileText());
        $sections[$name] = [
            'values' => [
                'path' => $path,
                'comment' => $comment,
            ],
            'acl' => $acl,
            'recycle' => !empty($args['recycle']),
        ];

        return $this->commit($sections, $path, $acl, !empty($args['recursive']), null);
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    private function homes(array $command): array
    {
        $args = is_array($command['args'] ?? null) ? $command['args'] : [];

        return $this->commit($this->sections($this->fileText()), null, [], false, !empty($args['enabled']));

        return $this->commit($sections, $path, $acl, !empty($args['recursive']));
    }

    /**
     * @param array<string, mixed> $command
     *
     * @return array{status: string, result: string}
     */
    private function remove(array $command): array
    {
        $args = is_array($command['args'] ?? null) ? $command['args'] : [];
        $name = $this->shareName($args['name'] ?? null);
        if (null === $name) {
            return ['status' => 'rejected', 'result' => 'Имя шары заполнено неверно'];
        }
        $sections = $this->sections($this->fileText());
        return $this->commit($sections, null, [], false, null);

        return $this->commit($sections, null, [], false);
    }
     * @param array<string, array{values: array<string, string>, acl: list<array{kind: string, name: string, access: string}>, recycle: bool}> $sections
     * @param list<array{kind: string, name: string, access: string}> $acl
     *
     * @return array{status: string, result: string}
     */
    private function commit(array $sections, ?string $path, array $acl, bool $recursive, ?bool $homes): array
    {
        if (!is_file($this->config->smbConf)) {
            return ['status' => 'failed', 'result' => 'smb.conf не найден'];
        }
        $target = $this->sharesFile();
        $previousShares = is_file($target) ? (string) file_get_contents($target) : null;
        $previousConf = (string) file_get_contents($this->config->smbConf);
        $homesOn = $homes ?? $this->homesOn($previousShares ?? '');
        $rendered = (new SmbTemplate($this->config))->render($previousConf);
        if (null === $rendered) {
            return ['status' => 'rejected', 'result' => 'В smb.conf нет workgroup или realm'];
        }
        $dir = dirname($target);
        if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
            return ['status' => 'failed', 'result' => 'Каталог файла шар не создаётся'];
        }
        if (false === file_put_contents($target, $this->render($sections, $homesOn))) {
            return ['status' => 'failed', 'result' => 'Файл шар не записан'];
        }
        if (false === file_put_contents($this->config->smbConf, $rendered)) {
            $this->restore($target, $previousShares);

            return ['status' => 'failed', 'result' => 'smb.conf не записан'];
        }
        $testparm = dirname($this->config->sambaTool).'/testparm';
        $check = $this->process(is_file($testparm) ? $testparm : '/usr/bin/testparm', ['-s', $this->config->smbConf]);
        if (0 !== $check['code']) {
            $this->restore($target, $previousShares);
            file_put_contents($this->config->smbConf, $previousConf);
                file_put_contents($this->config->smbConf, $previousConf);
            }

            return ['status' => 'failed', 'result' => '' !== $check['text'] ? $check['text'] : 'testparm отклонил настройку'];
        }
        $note = '';
        if (null !== $path) {
            if (!is_dir($path) && !@mkdir($path, 0770, true) && !is_dir($path)) {
                $note = ' Каталог не создан.';
            } else {
                $note = $this->applyAcl($path, $acl, $recursive);
            }
        }

        return ['status' => 'succeeded', 'result' => trim('Шара записана.'.$note)];
    }

    /**
     * @param list<array{kind: string, name: string, access: string}> $acl
     */
    private function applyAcl(string $path, array $acl, bool $recursive): string
    {
        $setfacl = is_file('/usr/bin/setfacl') ? '/usr/bin/setfacl' : '';
        if ('' === $setfacl || [] === $acl) {
            return '';
        }
        $notes = [];
        foreach ($acl as $row) {
            $mode = match ($row['access']) {
                'read' => 'r-x',
                'admin' => 'rwx',
                default => 'rwx',
            };
            $who = ('group' === $row['kind'] ? 'g:' : 'u:').$row['name'];
            $args = $recursive ? ['-R', '-m', $who.':'.$mode, $path] : ['-m', $who.':'.$mode, $path];
            $ran = $this->process($setfacl, $args);
            if (0 !== $ran['code']) {
                $notes[] = $row['name'];
            }
        }

        return [] === $notes ? '' : ' ACL не поставлены: '.implode(', ', $notes).'.';
    /**
     * @param array<string, array{values: array<string, string>, acl: list<array{kind: string, name: string, access: string}>, recycle: bool}> $sections
     */
    private function render(array $sections, bool $homes): string
    {
        $text = "# Шары XOS. Секцию global этот файл не содержит.\n";
        $text .= '# xos-homes '.($homes ? 'yes' : 'no')."\n\n";
        if ($homes) {
            $text .= $this->shareBody('homes', [
                'values' => [
                    'comment' => 'Home Directories',
                    'path' => '/home/%S',
                    'browseable' => 'no',
                    'read only' => 'no',
                ],
                'acl' => [],
                'recycle' => false,
            ], true);
        }
        foreach ($sections as $name => $section) {
            $text .= $this->shareBody($name, $section, false);
        }

        return $text;
    }

    /**
     * @param array{values: array<string, string>, acl: list<array{kind: string, name: string, access: string}>, recycle: bool} $section
     */
    private function shareBody(string $name, array $section, bool $homes): string
    {
        $text = '['.$name."]\n";
        $guest = $this->yes($section['values']['guest ok'] ?? '');
        $valid = [];
        $read = [];
        $write = [];
        $admin = [];
        foreach ($section['acl'] as $row) {
            $token = 'group' === $row['kind'] ? '@'.$row['name'] : $row['name'];
            $text .= "\t# xos-acl ".$row['kind'].':'.$row['name'].':'.$row['access']."\n";
            if ($guest) {
                continue;
            }
            $valid[] = '"'.$token.'"';
            if ('read' === $row['access']) {
                $read[] = '"'.$token.'"';
            } else {
                $write[] = '"'.$token.'"';
            }
            if ('admin' === $row['access']) {
                $admin[] = '"'.$token.'"';
            }
        }
        foreach ($section['values'] as $key => $value) {
            if ('' === $value && 'comment' === $key) {
                continue;
            }
            $text .= "\t".$key.' = '.$value."\n";
        }
        if (!$homes) {
            $text .= "\tbrowseable = yes\n";
            if ($guest) {
                $text .= "\tread only = no\n";
            }
        }
        $text .= "\tforce create mode = 0660\n";
        $text .= "\tforce directory mode = 0770\n";
        if (!$guest && [] !== $valid) {
            $text .= "\tvalid users = ".implode(' ', $valid)."\n";
            if ([] !== $read) {
                $text .= "\tread list = ".implode(' ', $read)."\n";
            }
            if ([] !== $write) {
                $text .= "\twrite list = ".implode(' ', $write)."\n";
            }
            if ([] !== $admin) {
                $text .= "\tadmin users = ".implode(' ', $admin)."\n";
            }
        }
        $vfs = ['acl_xattr'];
        if ($section['recycle']) {
            $vfs[] = 'recycle';
        }
        $text .= "\tvfs objects = ".implode(' ', $vfs)."\n";
        if ($section['recycle']) {
            $text .= "\trecycle:repository = .recycle\n";
            $text .= "\trecycle:keeptree = yes\n";
            $text .= "\trecycle:versions = yes\n";
        }
        $text .= "\n";
            $text .= "\n";
        }

        return $text;
    }
     * @return array<string, array{values: array<string, string>, acl: list<array{kind: string, name: string, access: string}>, recycle: bool}>
     */
    private function sections(string $text): array
    {
        $sections = [];
        $current = null;
        foreach (preg_split('/\R/', $text) ?: [] as $line) {
            $trim = trim($line);
            if (1 === preg_match('/^\[([^\]\r\n]+)\]$/', $trim, $match)) {
                $current = $match[1];
                if (0 === strcasecmp($current, 'homes')) {
                    $current = null;
                    continue;
                }
                $sections[$current] = ['values' => [], 'acl' => [], 'recycle' => false];
                continue;
            }
            if (null === $current) {
                continue;
            }
            if (1 === preg_match('/^# xos-acl (user|group):([^:]+):(read|write|admin)$/', $trim, $match)) {
                $sections[$current]['acl'][] = ['kind' => $match[1], 'name' => $match[2], 'access' => $match[3]];
                continue;
            }
            if ('' === $trim || str_starts_with($trim, '#') || str_starts_with($trim, ';')) {
                continue;
            }
            $parts = explode('=', $trim, 2);
            if (2 !== count($parts)) {
                continue;
            }
            $key = strtolower(trim($parts[0]));
            $value = trim($parts[1]);
            if ('vfs objects' === $key && str_contains($value, 'recycle')) {
                $sections[$current]['recycle'] = true;
            }
            if (in_array($key, ['valid users', 'read list', 'write list', 'admin users', 'browseable', 'read only', 'force create mode', 'force directory mode', 'vfs objects'], true) || str_starts_with($key, 'recycle:')) {
                continue;
            }
            $sections[$current]['values'][$key] = $value;
        }

        return $sections;
    }

    private function homesOn(string $text): bool
    {
        return 1 === preg_match('/^# xos-homes\s+yes\s*$/mi', $text);

        return $sections;
    }

    private function shareName(mixed $value): ?string
        if ('' === $name || str_starts_with($name, '-') || strlen($name) > 64 || 0 === strcasecmp($name, 'homes') || 1 === preg_match('/[\x00-\x1F\[\]#="]/', $name)) {
        $name = trim((string) $value);
        if ('' === $name || str_starts_with($name, '-') || strlen($name) > 64 || 1 === preg_match('/[\x00-\x1F\[\]#="]/', $name)) {
            return null;
        }

        return $name;
    }

    private function sharePath(mixed $value): ?string
    {
        $path = str_replace('\\', '/', trim((string) $value));
        if (!str_starts_with($path, '/') || str_contains($path, '..') || str_contains($path, "\n")) {
            return null;
        }
        $path = rtrim($path, '/');
        foreach (array_filter(array_map('trim', explode(',', $this->config->shareRoots))) as $root) {
            $root = rtrim(str_replace('\\', '/', $root), '/');
            if ('' !== $root && ($path === $root || str_starts_with($path, $root.'/'))) {
                return $path;
            }
        }

        return null;
    }

    /**
     * @return list<array{kind: string, name: string, access: string}>|null
     */
    private function acl(mixed $value): ?array
    {
        if (null === $value) {
            return [];
        }
        if (!is_array($value) || count($value) > 50) {
            return null;
        }
        $rows = [];
        foreach ($value as $row) {
            if (!is_array($row)) {
                return null;
            }
            $kind = (string) ($row['kind'] ?? '');
            $name = trim((string) ($row['name'] ?? ''));
            $access = (string) ($row['access'] ?? '');
            if (!in_array($kind, ['user', 'group'], true) || !in_array($access, ['read', 'write', 'admin'], true)) {
                return null;
            }
            if ('' === $name || str_starts_with($name, '-') || strlen($name) > 64 || 1 === preg_match('/[\x00-\x1F:]/', $name)) {
                return null;
            }
            $rows[] = ['kind' => $kind, 'name' => $name, 'access' => $access];
        }

        return $rows;
    }

    private function yes(string $value): bool
    {
        return in_array(strtolower($value), ['yes', 'true', '1'], true);
    }

    private function sharesFile(): string
    {
        return $this->config->sharesConf;
    }

    private function fileText(): string
    {
        $file = $this->sharesFile();

        return is_file($file) ? (string) file_get_contents($file) : '';
    }

    private function restore(string $target, ?string $previous): void
    {
        if (null === $previous) {
            @unlink($target);

            return;
        }
        file_put_contents($target, $previous);
    }

    /**
     * @param list<string> $args
     *
     * @return array{code: int, text: string}
     */
    private function process(string $binary, array $args): array
    {
        $descriptor = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = @proc_open(array_merge([$binary], $args), $descriptor, $pipes);
        if (!is_resource($process)) {
            return ['code' => 1, 'text' => 'Не удалось запустить '.$binary];
        }
        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $code = proc_close($process);
        $text = trim((string) $output."\n".(string) $error);

        return ['code' => $code, 'text' => strlen($text) > 200_000 ? substr($text, 0, 200_000) : $text];
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function encode(array $payload): string
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

        return is_string($json) ? $json : '[]';
    }
}
