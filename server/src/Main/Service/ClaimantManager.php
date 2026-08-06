<?php

namespace Main\Service;

use App\Security\ProtectedAppModules;
use AbstractManager;
use Main\Entity\Claimant;
use Main\Entity\Role;
use Main\Repository\ClaimantRepository;
use Main\Repository\RoleRepository;
use Psr\Log\LoggerInterface;
use Symfony\Component\Filesystem\Path;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ClaimantManager extends AbstractManager
{
    protected MainManager $mm;
    protected array $map = [];
    protected bool $isLoaded = false;

    /**
     * @var array<string, string>
     */
    private const DEFAULT_CAN_TITLES = [
        'can_create' => 'Создание',
        'can_read' => 'Чтение',
        'can_update' => 'Изменение',
        'can_delete' => 'Удаление',
        'can_access' => 'Права',
        'can_user' => 'Пользователи',
        'can_group' => 'Группы',
        'can_role' => 'Роли',
        'can_write' => 'Запись',
        'can_mod' => 'Модификация',
        'can_location' => 'Размещение',
        'can_write_off' => 'Списание',
        'can_repair' => 'Ремонт',
        'can_share' => 'Совместный доступ',
    ];

    public function __construct(
        ValidatorInterface $Validator,
        MainManager $mm,
        private readonly LoggerInterface $logger,
    ) {
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

    public function reBuild(bool $force = false): array
    {
        return $this->sync(false, $force);
    }

    /**
     * Sync claimants + access_options from glob setting.json into DB.
     *
     * @return array{
     *     upserted: list<string>,
     *     orphan: list<string>,
     *     errors: list<string>,
     *     bit_changes: list<string>,
     *     aborted: bool,
     *     dry_run: bool
     * }
     */
    public function sync(bool $dryRun = false, bool $force = false): array
    {
        $this->load();

        $report = [
            'upserted' => [],
            'orphan' => [],
            'errors' => [],
            'bit_changes' => [],
            'aborted' => false,
            'dry_run' => $dryRun,
        ];

        $planned = [];
        $seenCodes = [];

        foreach ($this->map as $moduleKey => $item) {
            $mapAccess = is_array($item['map-access'] ?? null) ? $item['map-access'] : [];
            foreach ($item['claimant'] ?? [] as $code => $name) {
                if (!is_string($code) || '' === $code) {
                    $report['errors'][] = sprintf('[%s] empty claimant code', $moduleKey);
                    continue;
                }
                if (isset($seenCodes[$code])) {
                    $report['errors'][] = sprintf(
                        'duplicate claimant code "%s" (modules %s and %s)',
                        $code,
                        $seenCodes[$code],
                        $moduleKey
                    );
                    continue;
                }
                $seenCodes[$code] = $moduleKey;

                try {
                    $node = $this->resolveClaimantAccessMap($code, $mapAccess);
                    $options = $this->normalizeAccessOptions($node, $code);
                } catch (\InvalidArgumentException $e) {
                    $report['errors'][] = $e->getMessage();
                    continue;
                }

                $planned[$code] = [
                    'code' => $code,
                    'name' => (string) $name,
                    'access_options' => $options,
                ];
            }
        }

        if ([] !== $report['errors']) {
            $report['aborted'] = true;

            return $report;
        }

        $repo = $this->getClaimantRepository();
        $existing = $repo->findAll();
        $existingByCode = [];
        foreach ($existing as $claimant) {
            $code = (string) $claimant->getCode();
            $existingByCode[$code] = $claimant;
        }

        foreach ($planned as $code => $row) {
            if (!isset($existingByCode[$code])) {
                continue;
            }
            $currentOptions = $existingByCode[$code]->getAccessOptions();
            foreach ($row['access_options'] as $canKey => $opt) {
                if (!isset($currentOptions[$canKey]) || !is_array($currentOptions[$canKey])) {
                    continue;
                }
                $oldBit = $currentOptions[$canKey]['bit'] ?? null;
                $newBit = $opt['bit'] ?? null;
                if (null !== $oldBit && null !== $newBit && (int) $oldBit !== (int) $newBit) {
                    $report['bit_changes'][] = sprintf(
                        '%s.%s: bit %s → %s',
                        $code,
                        $canKey,
                        (string) $oldBit,
                        (string) $newBit
                    );
                }
            }
        }

        foreach (array_keys($planned) as $code) {
            $report['upserted'][] = $code;
        }
        foreach (array_keys($existingByCode) as $code) {
            if (!isset($planned[$code])) {
                $report['orphan'][] = $code;
            }
        }
        sort($report['upserted']);
        sort($report['orphan']);

        if ([] !== $report['bit_changes'] && !$force) {
            $report['errors'][] = 'bit changed for known can_* keys; re-run with --force to overwrite access_options (access levels are not migrated)';
            $report['aborted'] = true;

            return $report;
        }

        if ($dryRun) {
            return $report;
        }

        $em = $this->getEntityManager();
        $conn = $em->getConnection();
        $conn->beginTransaction();
        try {
            foreach ($planned as $row) {
                $this->mm->claimant(['code' => $row['code']], [
                    'code' => $row['code'],
                    'name' => $row['name'],
                    'access_options' => $row['access_options'],
                ]);
            }
            foreach ($report['orphan'] as $code) {
                $this->mm->claimant(['code' => $code], [
                    'access_options' => [],
                ]);
            }
            $conn->commit();
        } catch (\Throwable $e) {
            if ($conn->isTransactionActive()) {
                $conn->rollBack();
            }
            $report['errors'][] = $e->getMessage();
            $report['aborted'] = true;
            $report['upserted'] = [];
            $report['orphan'] = [];
        }

        return $report;
    }

    /**
     * Resolve map-access node for claimant code (same rules as client resolveClaimantAccessMap).
     *
     * @param array<string, mixed> $mapAccess
     *
     * @return array<string, mixed> raw can_* leaves (+ nested keys ignored by caller)
     */
    public function resolveClaimantAccessMap(string $claimantCode, array $mapAccess): array
    {
        $parts = array_values(array_filter(explode('.', $claimantCode), static fn ($p) => '' !== $p));
        if ([] === $parts) {
            return [];
        }

        if (1 === count($parts)) {
            return $this->extractCanLeaves($mapAccess);
        }

        $current = $mapAccess;
        for ($i = 1, $count = count($parts); $i < $count; ++$i) {
            $segment = $parts[$i];
            if (!is_array($current) || !array_key_exists($segment, $current) || !is_array($current[$segment])) {
                return [];
            }
            $current = $current[$segment];
        }

        return $this->extractCanLeaves($current);
    }

    /**
     * @param array<string, mixed> $source
     *
     * @return array<string, mixed>
     */
    private function extractCanLeaves(array $source): array
    {
        $result = [];
        foreach ($source as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'can_')) {
                $result[$key] = $value;
            }
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $rawLeaves
     *
     * @return array<string, array{bit: int, title: string, description?: string}>
     *
     * @throws \InvalidArgumentException
     */
    private function normalizeAccessOptions(array $rawLeaves, string $claimantCode): array
    {
        $normalized = [];
        $usedBits = [];

        foreach ($rawLeaves as $canKey => $value) {
            if (!is_string($canKey) || !str_starts_with($canKey, 'can_')) {
                continue;
            }

            $entry = $this->normalizeCanLeaf($canKey, $value, $claimantCode);
            $bit = $entry['bit'];
            if (isset($usedBits[$bit])) {
                throw new \InvalidArgumentException(sprintf(
                    '%s: bit collision %d between %s and %s',
                    $claimantCode,
                    $bit,
                    $usedBits[$bit],
                    $canKey
                ));
            }
            $usedBits[$bit] = $canKey;
            $normalized[$canKey] = $entry;
        }

        return $normalized;
    }

    /**
     * @return array{bit: int, title: string, description?: string}
     *
     * @throws \InvalidArgumentException
     */
    private function normalizeCanLeaf(string $canKey, mixed $value, string $claimantCode): array
    {
        $title = null;
        $description = null;

        if (is_int($value)) {
            $bit = $value;
        } elseif (is_array($value)) {
            if (!array_key_exists('bit', $value) || !is_int($value['bit'])) {
                throw new \InvalidArgumentException(sprintf(
                    '%s.%s: bit must be a positive integer',
                    $claimantCode,
                    $canKey
                ));
            }
            $bit = $value['bit'];
            if (isset($value['title']) && is_string($value['title']) && '' !== $value['title']) {
                $title = $value['title'];
            }
            if (isset($value['description']) && is_string($value['description']) && '' !== $value['description']) {
                $description = $value['description'];
            }
        } else {
            throw new \InvalidArgumentException(sprintf(
                '%s.%s: invalid leaf (expected number or {bit, title})',
                $claimantCode,
                $canKey
            ));
        }

        if ($bit <= 0) {
            throw new \InvalidArgumentException(sprintf(
                '%s.%s: bit must be a positive integer, got %d',
                $claimantCode,
                $canKey,
                $bit
            ));
        }

        $title ??= self::DEFAULT_CAN_TITLES[$canKey] ?? $canKey;

        $result = [
            'bit' => $bit,
            'title' => $title,
        ];
        if (null !== $description) {
            $result['description'] = $description;
        }

        return $result;
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
     * Роли для вкладки «Дополнительные роли» — явный список, не связанный с доступом к приложениям.
     *
     * @return list<string>
     */
    public function getExtraRoles(): array
    {
        $this->load();

        $roles = [];
        $globalPath = Path::normalize($this->container->getParameter('kernel.project_dir')).'/src/Main/extra-roles.json';
        if (is_file($globalPath)) {
            $json = json_decode((string) file_get_contents($globalPath), true);
            if (is_array($json['roles'] ?? null)) {
                foreach ($json['roles'] as $role) {
                    if (is_string($role) && '' !== $role) {
                        $roles[] = $role;
                    }
                }
            }
        }

        foreach ($this->map as $item) {
            if (!is_array($item['extra-roles'] ?? null)) {
                continue;
            }
            foreach ($item['extra-roles'] as $role) {
                if (is_string($role) && '' !== $role) {
                    $roles[] = $role;
                }
            }
        }

        sort($roles);

        return array_values(array_unique($roles));
    }

    /**
     * Модули для вкладки «Доступ к приложениям» — из setting.json + access_options из БД.
     * Todo/IBlock не входят (только ProtectedAppModules). Options sync-on-read не выполняется.
     *
     * @return list<array{
     *     module: string,
     *     moduleLabel: string,
     *     root?: array{id: int, code: string, name: string, access_options: object|array},
     *     children: list<array{id: int, code: string, name: string, access_options: object|array}>
     * }>
     */
    public function getAppAccessModules(): array
    {
        $this->load();
        $result = [];

        foreach (ProtectedAppModules::all() as $moduleKey) {
            $config = $this->map[$moduleKey] ?? null;
            if (null === $config) {
                continue;
            }

            $group = [
                'module' => $moduleKey,
                'moduleLabel' => (string) ($config['name'] ?? $moduleKey),
                'children' => [],
            ];

            foreach ($config['claimant'] ?? [] as $code => $name) {
                $claimant = $this->getClaimantRepository()->findOneBy(['code' => $code]);
                if (null === $claimant) {
                    $claimant = $this->mm->claimant(['code' => $code], [
                        'code' => $code,
                        'name' => $name,
                    ]);
                }

                $ref = [
                    'id' => $claimant->getId(),
                    'code' => $code,
                    'name' => $name,
                    'access_options' => $this->accessOptionsForApi($claimant, true),
                ];

                $parts = explode('.', $code);
                if (1 === count($parts) && $parts[0] === $moduleKey) {
                    $group['root'] = $ref;
                    $group['moduleLabel'] = $name;
                } elseif (count($parts) > 1 && $parts[0] === $moduleKey) {
                    $group['children'][] = $ref;
                }
            }

            $result[] = $group;
        }

        return $result;
    }

    /**
     * JSON object for API (empty / list → {}). Optionally warn when options missing (protected UI path).
     *
     * @return object
     */
    public function accessOptionsForApi(Claimant $claimant, bool $warnIfEmpty = false): object
    {
        $options = $claimant->getAccessOptions();
        $empty = !\is_array($options) || $options === [] || array_is_list($options);
        if ($empty) {
            if ($warnIfEmpty) {
                $this->logger->warning(
                    'Claimant access_options empty; run main:claimant:sync',
                    ['code' => $claimant->getCode(), 'id' => $claimant->getId()]
                );
            }

            return (object) [];
        }

        // Cast so json_encode emits {} not [] for empty-looking structures.
        return (object) $options;
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
     * Извлечь bit из leaf map-access: number или {bit, title[, description]}.
     */
    public function normalizeCanBit(mixed $leaf): ?int
    {
        if (is_int($leaf) && $leaf > 0) {
            return $leaf;
        }
        if (is_array($leaf) && array_key_exists('bit', $leaf) && is_int($leaf['bit']) && $leaf['bit'] > 0) {
            return $leaf['bit'];
        }

        return null;
    }

    /**
     * Значение бита can_* для полного scope (can_read.main.user).
     * Runtime: только файлы setting.json (не БД).
     */
    public function getCanScopeValue(string $scope): int
    {
        $this->load();
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

        return $this->normalizeCanBit($current[$canKey]) ?? 0;
    }

    private function sumCanBits(array $map): int
    {
        $ret = 0;
        foreach ($map as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'can_')) {
                $bit = $this->normalizeCanBit($value);
                if (null !== $bit) {
                    $ret |= $bit;
                }
            }
        }

        return $ret;
    }

    private function sumAllCanBits(array $map): int
    {
        $ret = 0;
        foreach ($map as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'can_')) {
                $bit = $this->normalizeCanBit($value);
                if (null !== $bit) {
                    $ret |= $bit;
                }
            } elseif (is_array($value)) {
                $ret |= $this->sumCanBits($value);
            }
        }

        return $ret;
    }
}
