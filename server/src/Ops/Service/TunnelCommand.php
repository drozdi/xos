<?php

namespace Ops\Service;

/** OpenSSH local forward. The listen side is only this machine. */
final class TunnelCommand
{
    /**
     * @return list<string>
     */
    public static function arguments(
        string $binary,
        string $keyFile,
        string $knownHosts,
        int $listenPort,
        string $targetHost,
        int $targetPort,
        int $sshPort,
        string $destination,
    ): array {
        return [
            $binary,
            '-N',
            '-i', $keyFile,
            '-p', (string) $sshPort,
            '-L', '127.0.0.1:'.$listenPort.':'.$targetHost.':'.$targetPort,
            '-o', 'ExitOnForwardFailure=yes',
            '-o', 'ServerAliveInterval=15',
            '-o', 'ServerAliveCountMax=3',
            '-o', 'StrictHostKeyChecking=yes',
            '-o', 'UserKnownHostsFile='.$knownHosts,
            '-o', 'IdentitiesOnly=yes',
            '-o', 'BatchMode=yes',
            '-o', 'ConnectTimeout=10',
            '-o', 'PreferredAuthentications=publickey',
            $destination,
        ];
    }
}
