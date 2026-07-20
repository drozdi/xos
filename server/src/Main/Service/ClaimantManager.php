<?php

namespace Main\Service;

use AbstractManager;
use Main\Entity\Claimant;
use Main\Entity\Role;
use Main\Repository\ClaimantRepository;
use Main\Repository\RoleRepository;
use Symfony\Component\Filesystem\Path;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ClaimantManager extends AbstractManager
{
    protected MainManager $mm;
    protected array $map = [];
    protected bool $isLoaded = false;

    public function __construct(ValidatorInterface $Validator, MainManager $mm)
    {
        parent::__construct($Validator);
        $this->mm = $mm;
    }

    public function getRoleRepository(): ?RoleRepository
    {
        return $this->getEntityManager()->getRepository(Role::class);
    }

    public function getClaimantRepository(): ?ClaimantRepository
    {
        return $this->getEntityManager()->getRepository(Claimant::class);
    }

    public function load(): void
    {
        if ($this->isLoaded) {
            return;
        }
        $path = Path::normalize($this->container->getParameter('kernel.project_dir')).'/src/*/setting.json';
        foreach (glob($path) as $file) {
            $json = json_decode(file_get_contents($file), true);
            if (!is_array($json) || !isset($json['name'])) {
                continue;
            }
            $this->map[strtolower((string) $json['name'])] = $json;
        }
        $this->isLoaded = true;
    }

    public function reBuild(): void
    {
        foreach ($this->map as $item) {
            foreach ($item['claimant'] ?? [] as $k => $n) {
                $this->mm->claimant([
                    'code' => $k,
                ], [
                    'code' => $k,
                    'name' => $n,
                ]);
            }
        }
    }

    public function getMap(): ?array
    {
        $this->load();

        return $this->map;
    }

    public function getModuleConfig(string $module): ?array
    {
        $this->load();

        return $this->map[strtolower($module)] ?? null;
    }

    /**
     * Сумма всех can_* для claimant-кода (например main.user → user в map-access Main).
     */
    public function getAccessesRoot(string $claimantCode): int
    {
        $this->load();
        $parts = explode('.', $claimantCode);
        $module = strtolower($parts[0]);
        $config = $this->map[$module] ?? null;
        if (null === $config) {
            return 0;
        }

        $map = $config['map-access'] ?? [];
        if (1 === count($parts)) {
            return $this->sumAllCanBits($map);
        }

        $entityKey = $parts[1];
        $entityMap = $map[$entityKey] ?? [];

        return $this->sumCanBits(is_array($entityMap) ? $entityMap : []);
    }

    /**
     * @return array<string, int>
     */
    public function getAccessesRole(string $role): array
    {
        $this->load();
        $ret = [];

        if ('ROLE_ROOT' === $role) {
            foreach ($this->map as $item) {
                foreach ($item['claimant'] ?? [] as $code => $name) {
                    $ret[$code] = $this->getAccessesRoot($code);
                }
            }

            return $ret;
        }

        if (preg_match('/^ROLE_(.+)_ROOT$/', $role, $matches)) {
            $claimantCode = strtolower(str_replace('_', '.', $matches[1]));
            $ret[$claimantCode] = ($ret[$claimantCode] ?? 0) | $this->getAccessesRoot($claimantCode);
        }

        return $ret;
    }

    /**
     * Значение бита can_* для полного scope (can_read.main.user).
     */
    public function getCanScopeValue(string $scope): int
    {
        $segments = explode('.', $scope);
        $canKey = array_shift($segments);
        if (!is_string($canKey) || !str_starts_with($canKey, 'can_') || [] === $segments) {
            return 0;
        }

        $module = strtolower($segments[0]);
        $config = $this->map[$module] ?? null;
        if (null === $config) {
            return 0;
        }

        $current = $config['map-access'] ?? [];
        for ($i = 1, $count = count($segments); $i < $count; ++$i) {
            if (!is_array($current) || !array_key_exists($segments[$i], $current)) {
                return 0;
            }
            $current = $current[$segments[$i]];
        }

        if (!is_array($current) || !array_key_exists($canKey, $current)) {
            return 0;
        }

        return (int) $current[$canKey];
    }

    private function sumCanBits(array $map): int
    {
        $ret = 0;
        foreach ($map as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'can_')) {
                $ret |= (int) $value;
            }
        }

        return $ret;
    }

    private function sumAllCanBits(array $map): int
    {
        $ret = 0;
        foreach ($map as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'can_')) {
                $ret |= (int) $value;
            } elseif (is_array($value)) {
                $ret |= $this->sumCanBits($value);
            }
        }

        return $ret;
    }
}
