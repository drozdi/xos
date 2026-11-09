<?php

namespace Ops\Service;

use Doctrine\ORM\EntityManagerInterface;
use Main\Entity\User;
use Ops\Entity\OpsLink;
use Ssh\Entity\SshConnection;
use Ssh\Service\SshClient;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

final class TunnelRuntime
{
    private const MAX_RUNNING = 3;

    public function __construct(
        private readonly SshClient $client,
        private readonly EntityManagerInterface $entityManager,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
    ) {
    }

    public function isRunning(int $userId, int $linkId): bool
    {
        $meta = $this->read($this->file($userId, $linkId));

        return null !== $meta && $this->owned($meta);
    }

    public function start(User $user, OpsLink $link, bool $acceptHostKey): void
    {
        $userId = $user->getId();
        $linkId = $link->getId();
        if (null === $userId || null === $linkId) {
            throw new BadRequestHttpException('Туннель не сохранён');
        }
        if ($this->isRunning($userId, $linkId)) {
            throw new BadRequestHttpException('Туннель уже запущен');
        }
        $connection = $link->getSshConnection();
        if (!$connection instanceof SshConnection || $connection->getUser()->getId() !== $userId) {
            throw new BadRequestHttpException('Подключение SSH не найдено');
        }
        $this->sweep($userId, $link->getListenPort());
        [$pem, $passphrase] = $this->client->identity($connection);
        if (false !== $passphrase) {
            throw new BadRequestHttpException('Ключ с парольной фразой для туннеля не подходит');
        }
        $ssh = $this->client->connect($connection, $acceptHostKey, 80, 24);
        $hostKey = (string) $ssh->getServerPublicHostKey();
        try {
            $ssh->disconnect();
        } catch (\Throwable) {
        }
        $fingerprint = SshClient::fingerprint($hostKey);
        if ($connection->getHostKeyFingerprint() !== $fingerprint) {
            $connection->setHostKeyFingerprint($fingerprint);
            $this->entityManager->flush();
        }

        $dir = $this->directory();
        $keyFile = $dir.'/'.$userId.'-'.$linkId.'.key';
        $knownHosts = $dir.'/'.$userId.'-'.$linkId.'.known';
        $log = $dir.'/'.$userId.'-'.$linkId.'.log';
        $pem = str_ends_with($pem, "\n") ? $pem : $pem."\n";
        if (false === file_put_contents($keyFile, $pem)) {
            throw new BadRequestHttpException('Не удалось подготовить ключ');
        }
        $this->protect($keyFile);
        $parts = preg_split('/\s+/', trim($hostKey)) ?: [];
        if (!isset($parts[0], $parts[1]) || '' === $parts[0] || '' === $parts[1]) {
            $this->deleteFiles($userId, $linkId);
            throw new BadRequestHttpException('Сервер не отдал ключ хоста');
        }
        $destinationHost = str_contains($connection->getHost(), ':') ? '['.$connection->getHost().']' : $connection->getHost();
        $knownName = 22 === $connection->getPort()
            ? $destinationHost
            : '['.trim($destinationHost, '[]').']:'.$connection->getPort();
        file_put_contents($knownHosts, $knownName.' '.$parts[0].' '.$parts[1]."\n");
        $marker = '127.0.0.1:'.$link->getListenPort().':'.$link->getTargetHost().':'.$link->getTargetPort();
        $args = TunnelCommand::arguments(
            $this->binary(),
            $keyFile,
            $knownHosts,
            $link->getListenPort(),
            $link->getTargetHost(),
            $link->getTargetPort(),
            $connection->getPort(),
            $connection->getUsername().'@'.$destinationHost,
        );
        try {
            $pid = $this->spawn($args, $log);
        } catch (BadRequestHttpException $error) {
            $this->deleteFiles($userId, $linkId);
            throw $error;
        }
        $meta = [
            'pid' => $pid,
            'marker' => $marker,
            'key_file' => $keyFile,
            'known_hosts' => $knownHosts,
            'log' => $log,
            'listen_port' => $link->getListenPort(),
        ];
        file_put_contents($this->file($userId, $linkId), json_encode($meta, JSON_THROW_ON_ERROR));
        usleep(1_200_000);
        if (!$this->owned($meta)) {
            $message = $this->logMessage($log);
            $line = $this->commandLine($pid);
            if ('' === trim($line) || str_contains(strtolower($line), 'ssh')) {
                $this->kill($pid);
            }
            $this->deleteFiles($userId, $linkId);
            throw new BadRequestHttpException($message);
        }
    }

    public function stop(User $user, OpsLink $link): void
    {
        $userId = $user->getId();
        $linkId = $link->getId();
        if (null === $userId || null === $linkId) {
            return;
        }
        $meta = $this->read($this->file($userId, $linkId));
        if (null !== $meta && $this->owned($meta)) {
            $this->kill((int) $meta['pid']);
        }
        $this->deleteFiles($userId, $linkId);
    }

    private function sweep(int $userId, int $listenPort): void
    {
        $running = 0;
        foreach (glob($this->directory().'/'.$userId.'-*.json') ?: [] as $file) {
            $meta = $this->read($file);
            if (null === $meta || !$this->owned($meta)) {
                $this->deletePath($file);
                if (null !== $meta) {
                    $this->deleteListed($meta);
                }
                continue;
            }
            if ((int) ($meta['listen_port'] ?? 0) === $listenPort) {
                throw new BadRequestHttpException('Порт слушателя уже занят');
            }
            ++$running;
        }
        if ($running >= self::MAX_RUNNING) {
            throw new BadRequestHttpException('Уже запущено три туннеля');
        }
    }

    /**
     * @param array<string, mixed> $meta
     */
    private function owned(array $meta): bool
    {
        $pid = (int) ($meta['pid'] ?? 0);
        $marker = (string) ($meta['marker'] ?? '');
        if ($pid < 1 || '' === $marker || !$this->alive($pid)) {
            return false;
        }

        return str_contains($this->commandLine($pid), $marker);
    }

    private function alive(int $pid): bool
    {
        if (\PHP_OS_FAMILY === 'Windows') {
            return str_contains($this->capture(['tasklist', '/FI', 'PID eq '.$pid, '/NH']), (string) $pid);
        }
        if (\function_exists('posix_kill')) {
            return posix_kill($pid, 0);
        }

        return '' !== $this->commandLine($pid);
    }

    private function commandLine(int $pid): string
    {
        if (\PHP_OS_FAMILY === 'Windows') {
            return $this->capture([
                'powershell',
                '-NoProfile',
                '-Command',
                '(Get-CimInstance Win32_Process -Filter "ProcessId='.$pid.'").CommandLine',
            ]);
        }
        $line = @file_get_contents('/proc/'.$pid.'/cmdline');

        return \is_string($line) ? str_replace("\0", ' ', $line) : '';
    }

    private function kill(int $pid): void
    {
        if (\PHP_OS_FAMILY === 'Windows') {
            $this->capture(['taskkill', '/F', '/PID', (string) $pid]);

            return;
        }
        if (\function_exists('posix_kill')) {
            posix_kill($pid, 15);

            return;
        }
        $this->capture(['kill', (string) $pid]);
    }

    /**
     * @param list<string> $args
     */
    private function spawn(array $args, string $log): int
    {
        if (\PHP_OS_FAMILY === 'Windows') {
            $exe = "'".str_replace("'", "''", $args[0])."'";
            $list = implode(',', array_map(
                static fn (string $arg): string => "'".str_replace("'", "''", $arg)."'",
                \array_slice($args, 1),
            ));
            $stdout = $log.'.out';
            $quotedLog = "'".str_replace("'", "''", $log)."'";
            $quotedOut = "'".str_replace("'", "''", $stdout)."'";
            $script = 'Start-Process -FilePath '.$exe.' -ArgumentList @('.$list.') -WindowStyle Hidden -RedirectStandardError '.$quotedLog.' -RedirectStandardOutput '.$quotedOut.' -PassThru | Select-Object -ExpandProperty Id';
            $pid = (int) trim($this->capture(['powershell', '-NoProfile', '-Command', $script]));
        } else {
            $command = 'setsid '.implode(' ', array_map('escapeshellarg', $args)).' > '.escapeshellarg($log).' 2>&1 < /dev/null & echo $!';
            $pid = (int) trim($this->capture(['sh', '-c', $command]));
        }
        if ($pid < 1) {
            throw new BadRequestHttpException($this->logMessage($log));
        }

        return $pid;
    }

    private function binary(): string
    {
        if (\PHP_OS_FAMILY === 'Windows' && is_file('C:\\Windows\\System32\\OpenSSH\\ssh.exe')) {
            return 'C:\\Windows\\System32\\OpenSSH\\ssh.exe';
        }
        $found = trim($this->capture(\PHP_OS_FAMILY === 'Windows' ? ['where', 'ssh'] : ['sh', '-c', 'command -v ssh']));
        $line = strtok($found, "\r\n") ?: '';
        if ('' !== $line && (is_file($line) || 'ssh' === $line)) {
            return $line;
        }

        throw new BadRequestHttpException('Не найден клиент OpenSSH (ssh)');
    }

    private function protect(string $file): void
    {
        if (\PHP_OS_FAMILY !== 'Windows') {
            @chmod($file, 0600);

            return;
        }
        $who = trim($this->capture(['whoami']));
        if ('' === $who) {
            return;
        }
        $this->capture(['icacls', $file, '/inheritance:r']);
        $this->capture(['icacls', $file, '/grant:r', $who.':R']);
    }

    private function logMessage(string $log): string
    {
        $text = is_file($log) ? (string) file_get_contents($log) : '';
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
        if ('' === $text) {
            return 'Туннель не запустился';
        }
        if (strlen($text) > 240) {
            $text = substr($text, 0, 240);
        }

        return $text;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function read(string $file): ?array
    {
        if (!is_file($file)) {
            return null;
        }
        try {
            $decoded = json_decode((string) file_get_contents($file), true, 8, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return null;
        }

        return \is_array($decoded) ? $decoded : null;
    }

    private function deleteFiles(int $userId, int $linkId): void
    {
        $meta = $this->read($this->file($userId, $linkId));
        if (null !== $meta) {
            $this->deleteListed($meta);
        }
        $this->deletePath($this->file($userId, $linkId));
        $dir = $this->directory();
        foreach (['.key', '.known', '.log', '.log.out'] as $suffix) {
            $this->deletePath($dir.'/'.$userId.'-'.$linkId.$suffix);
        }
    }

    /**
     * @param array<string, mixed> $meta
     */
    private function deleteListed(array $meta): void
    {
        foreach (['key_file', 'known_hosts', 'log'] as $key) {
            if (isset($meta[$key]) && \is_string($meta[$key])) {
                $this->deletePath($meta[$key]);
            }
        }
    }

    private function deletePath(string $path): void
    {
        if (is_file($path)) {
            @unlink($path);
        }
    }

    private function file(int $userId, int $linkId): string
    {
        return $this->directory().'/'.$userId.'-'.$linkId.'.json';
    }

    private function directory(): string
    {
        $dir = $this->projectDir.'/var/tunnels';
        if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
            throw new BadRequestHttpException('Не удалось подготовить туннель');
        }

        return $dir;
    }

    /**
     * @param list<string> $command
     */
    private function capture(array $command): string
    {
        $pipes = [];
        $process = @proc_open($command, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        if (!\is_resource($process)) {
            return '';
        }
        $stdout = stream_get_contents($pipes[1]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        proc_close($process);

        return \is_string($stdout) ? $stdout : '';
    }
}
