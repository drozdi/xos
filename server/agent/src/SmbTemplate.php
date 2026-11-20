<?php

namespace Xos\Agent;

/** Собирает smb.conf по образцу шаблона Zentyal, не затирая DNS, TLS и idmap. */
final class SmbTemplate
{
    public function __construct(private readonly Config $config)
    {
    }

    /**
     * @return array{status: string, result: string}
     */
    public function apply(): array
    {
        if (!is_file($this->config->smbConf)) {
            return ['status' => 'failed', 'result' => 'smb.conf не найден'];
        }
        $previous = (string) file_get_contents($this->config->smbConf);
        $rendered = $this->render($previous);
        if (null === $rendered) {
            return ['status' => 'rejected', 'result' => 'В smb.conf нет workgroup или realm'];
        }
        $createdShares = false;
        if (!is_file($this->config->sharesConf)) {
            $dir = dirname($this->config->sharesConf);
            if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
                return ['status' => 'failed', 'result' => 'Каталог файла шар не создаётся'];
            }
            if (false === file_put_contents($this->config->sharesConf, "# Шары XOS. Секцию global этот файл не содержит.\n# xos-homes no\n")) {
                return ['status' => 'failed', 'result' => 'Файл шар не создан'];
            }
            $createdShares = true;
        }
        if (false === file_put_contents($this->config->smbConf, $rendered)) {
            if ($createdShares) {
                @unlink($this->config->sharesConf);
            }

            return ['status' => 'failed', 'result' => 'smb.conf не записан'];
        }
        $check = $this->testparm();
        if (0 !== $check['code']) {
            file_put_contents($this->config->smbConf, $previous);
            if ($createdShares) {
                @unlink($this->config->sharesConf);
            }

            return ['status' => 'failed', 'result' => '' !== $check['text'] ? $check['text'] : 'testparm отклонил smb.conf'];
        }

        return ['status' => 'succeeded', 'result' => 'smb.conf собран'];
    }

    public function render(string $existing): ?string
    {
        $global = [];
        $preserved = [];
        $sysvol = '';
        $netlogon = '';
        $section = '';
        foreach (preg_split('/\R/', $existing) ?: [] as $line) {
            $trim = trim($line);
            if (1 === preg_match('/^\[([^\]\r\n]+)\]$/', $trim, $match)) {
                $section = strtolower($match[1]);
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
            if ('global' === $section) {
                $global[$key] = $value;
                if ($this->keep($key)) {
                    $preserved[] = [$key, $value];
                }
            } elseif ('sysvol' === $section && 'path' === $key && '' === $sysvol) {
                $sysvol = $value;
            } elseif ('netlogon' === $section && 'path' === $key && '' === $netlogon) {
                $netlogon = $value;
            }
        }
        $workgroup = trim((string) ($global['workgroup'] ?? ''));
        $realm = trim((string) ($global['realm'] ?? ''));
        if ('' === $workgroup || '' === $realm) {
            return null;
        }
        $netbios = trim((string) ($global['netbios name'] ?? ''));
        if ('' === $netbios) {
            $netbios = strtoupper((string) preg_replace('/\..*$/', '', php_uname('n')));
        }
        $role = trim((string) ($global['server role'] ?? ''));
        if ('' === $role) {
            $role = 'active directory domain controller';
        }
        $description = trim((string) ($global['server string'] ?? ''));
        if ('' === $description) {
            $description = 'XOS Samba';
        }
        if ('' === $sysvol) {
            $sysvol = '/var/lib/samba/sysvol';
        }
        if ('' === $netlogon) {
            $netlogon = rtrim($sysvol, '/').'/'.strtolower($realm).'/scripts';
        }
        $lines = [
            '[global]',
            "\tworkgroup = ".$workgroup,
            "\trealm = ".$realm,
            "\tnetbios name = ".$netbios,
            "\tserver string = ".$description,
            "\tserver role = ".$role,
            "\tserver role check:inhibit = yes",
            "\tserver services = -dns",
            "\tserver signing = auto",
            "\tdsdb:schema update allowed = yes",
            "\tldap server require strong auth = no",
            "\tdrs:max object sync = 1200",
            '',
            "\tidmap_ldb:use rfc2307 = yes",
            '',
            "\twinbind enum users = yes",
            "\twinbind enum groups = yes",
            "\ttemplate shell = /bin/bash",
            "\ttemplate homedir = /home/%U",
            '',
            "\tusershare path =",
            '',
            "\trpc server dynamic port range = 49152-65535",
            '',
            "\tmap to guest = Bad User",
            '',
            "\trestrict anonymous = 2",
            '',
            "\tlog level = 3",
            "\tlog file = /var/log/samba/samba.log",
            "\tmax log size = 100000",
        ];
        foreach ($preserved as [$key, $value]) {
            $lines[] = "\t".$key.' = '.$value;
        }
        $lines[] = '';
        $lines[] = "\tinclude = ".$this->config->sharesConf;
        $lines[] = '';
        $lines[] = '[netlogon]';
        $lines[] = "\tpath = ".$netlogon;
        $lines[] = "\tbrowseable = no";
        $lines[] = "\tread only = yes";
        $lines[] = '';
        $lines[] = '[sysvol]';
        $lines[] = "\tpath = ".$sysvol;
        $lines[] = "\tread only = no";
        $lines[] = '';

        return implode("\n", $lines);
    }

    private function keep(string $key): bool
    {
        return 'dns forwarder' === $key || str_starts_with($key, 'tls') || str_starts_with($key, 'idmap config');
    }

    /**
     * @return array{code: int, text: string}
     */
    private function testparm(): array
    {
        $binary = is_file('/usr/bin/testparm') ? '/usr/bin/testparm' : 'testparm';
        $descriptor = [1 => ['pipe', 'w'], 2 => ['pipe', 'w']];
        $process = @proc_open([$binary, '-s', $this->config->smbConf], $descriptor, $pipes);
        if (!is_resource($process)) {
            return ['code' => 1, 'text' => 'Не удалось запустить testparm'];
        }
        $output = stream_get_contents($pipes[1]);
        $error = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $code = proc_close($process);
        $text = trim((string) $output."\n".(string) $error);

        return ['code' => $code, 'text' => strlen($text) > 200_000 ? substr($text, 0, 200_000) : $text];
    }
}
