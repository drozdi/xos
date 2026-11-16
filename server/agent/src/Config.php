<?php

namespace Xos\Agent;

final class Config
{
    public function __construct(
        public readonly string $url,
        public readonly int $serverId,
        public readonly string $enrollToken,
        public readonly string $caFile,
        public readonly string $prefer,
        public readonly int $heartbeatSec,
        public readonly string $stateDir,
        public readonly string $smbConf,
        public readonly string $sambaTool,
        public readonly string $ldbmodify,
        public readonly string $ldbsearch,
        public readonly string $samLdb,
        public readonly string $shareRoots,
        public readonly bool $allowProvision,
    ) {
    }

    public static function load(string $path): self
    {
        if (!is_file($path)) {
            throw new \RuntimeException('Нет файла настроек '.$path);
        }
        $ini = parse_ini_file($path, true, INI_SCANNER_TYPED);
        if (!is_array($ini)) {
            throw new \RuntimeException('Файл настроек не читается');
        }
        $xos = is_array($ini['xos'] ?? null) ? $ini['xos'] : [];
        $transport = is_array($ini['transport'] ?? null) ? $ini['transport'] : [];
        $samba = is_array($ini['samba'] ?? null) ? $ini['samba'] : [];
        $agent = is_array($ini['agent'] ?? null) ? $ini['agent'] : [];
        $url = rtrim((string) ($xos['url'] ?? ''), '/');
        if ('' === $url) {
            throw new \RuntimeException('В настройках не задан адрес XOS');
        }

        return new self(
            $url,
            (int) ($xos['server_id'] ?? 0),
            trim((string) ($xos['enroll_token'] ?? '')),
            trim((string) ($xos['ca_file'] ?? '')),
            (string) ($transport['prefer'] ?? 'poll'),
            max(10, (int) ($transport['heartbeat_sec'] ?? 30)),
            (string) ($agent['state_dir'] ?? '/var/lib/xos-agent'),
            (string) ($samba['smb_conf'] ?? '/etc/samba/smb.conf'),
            (string) ($samba['samba_tool'] ?? '/usr/bin/samba-tool'),
            (string) ($samba['ldbmodify'] ?? '/usr/bin/ldbmodify'),
            (string) ($samba['ldbsearch'] ?? '/usr/bin/ldbsearch'),
            (string) ($samba['sam_ldb'] ?? '/var/lib/samba/private/sam.ldb'),
            (string) ($samba['share_roots'] ?? '/srv/samba'),
            filter_var($samba['allow_provision'] ?? true, FILTER_VALIDATE_BOOLEAN),
        );
    }
}
