<?php

namespace Samba\Service;

use App\Security\UserScopeResolver;
use Main\Entity\User;
use Main\Repository\UserRepository;
use Samba\Entity\SambaServer;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class SambaAgentBundle
{
    public function __construct(
        private readonly UserRepository $users,
        private readonly UserPasswordHasherInterface $passwords,
        private readonly UserScopeResolver $scopes,
        private readonly SambaAgentService $agents,
        #[Autowire('%kernel.project_dir%')]
        private readonly string $projectDir,
        #[Autowire('%env(default::resolve:SAMBA_AGENT_CA_FILE)%')]
        private readonly ?string $caFile = null,
    ) {
    }

    public function build(string $login, string $password, int $serverId, string $baseUrl): string
    {
        $user = $this->users->findOneBy(['login' => $login]);
        if (!$user instanceof User || !$user->isActive() || $user->isLoocked() || !$this->passwords->isPasswordValid($user, $password)) {
            throw new UnauthorizedHttpException('', 'Неверный логин или пароль');
        }
        if (!$this->scopes->canAccessModule($user, 'samba')) {
            throw new UnauthorizedHttpException('', 'Недостаточно прав');
        }
        $server = $this->agents->requireServer($serverId);
        if (!SambaGuard::isOwner($user, $server)) {
            throw new NotFoundHttpException('Сервер не найден');
        }
        $certificate = $this->certificate();
        $issued = $this->agents->issueEnrollment($user, $server, $baseUrl);
        $settings = $this->settings($baseUrl, $server, $issued['token']);
        $zip = new ZipStore();
        $root = $this->projectDir.'/agent';
        foreach (['bin', 'src', 'protocol', 'systemd'] as $dir) {
            $this->addTree($zip, $root.'/'.$dir, $dir);
        }
        $script = (string) file_get_contents($root.'/install.sh');
        $zip->add('install.sh', $script);
        $zip->add('agent.ini', $settings);
        $zip->add('ca.pem', $certificate);

        return $zip->binary();
    }

    private function certificate(): string
    {
        $path = trim((string) $this->caFile);
        if ('' === $path || !is_file($path)) {
            throw new ServiceUnavailableHttpException(null, 'Сертификат агента не настроен');
        }
        $pem = (string) file_get_contents($path);
        if (!str_contains($pem, 'BEGIN CERTIFICATE')) {
            throw new ServiceUnavailableHttpException(null, 'Сертификат агента не настроен');
        }

        return $pem;
    }

    private function settings(string $baseUrl, SambaServer $server, string $token): string
    {
        $url = rtrim($baseUrl, '/');
        $lines = [
            '[xos]',
            'url = '.$url,
            'server_id = '.$server->getId(),
            'enroll_token = '.$token,
            'ca_file = /etc/xos-agent/ca.pem',
            '',
            '[transport]',
            'prefer = poll',
            'heartbeat_sec = 30',
            'listen = 0.0.0.0:8765',
            '',
            '[samba]',
            'smb_conf = /etc/samba/smb.conf',
            'samba_tool = /usr/bin/samba-tool',
            'ldbmodify = /usr/bin/ldbmodify',
            'ldbsearch = /usr/bin/ldbsearch',
            'sam_ldb = /var/lib/samba/private/sam.ldb',
            'share_roots = /srv/samba',
            'shares_conf = /etc/samba/xos-shares.conf',
            'allow_provision = true',
            '',
            '[agent]',
            'state_dir = /var/lib/xos-agent',
            'log_level = info',
            '',
        ];

        return implode("\n", $lines);
    }

    private function addTree(ZipStore $zip, string $directory, string $prefix): void
    {
        if (!is_dir($directory)) {
            throw new ServiceUnavailableHttpException(null, 'Каталог агента не найден');
        }
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS));
        foreach ($iterator as $file) {
            if (!$file instanceof \SplFileInfo || !$file->isFile()) {
                continue;
            }
            $relative = $prefix.'/'.substr($file->getPathname(), strlen($directory) + 1);
            $zip->add(str_replace('\\', '/', $relative), (string) file_get_contents($file->getPathname()));
        }
    }
}
