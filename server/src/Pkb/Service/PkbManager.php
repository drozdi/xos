<?php



namespace Pkb\Service;



use AbstractManager;

use Explorer\Service\ExplorerManager;

use Main\Entity\User;

use Main\Repository\UserRepository;

use Pkb\Entity\Vault;

use Pkb\Entity\VaultMember;

use Pkb\Enum\VaultMemberRole;

use Pkb\Repository\VaultMemberRepository;

use Pkb\Repository\VaultRepository;

use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;

use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

use Symfony\Component\Validator\Validator\ValidatorInterface;



class PkbManager extends AbstractManager

{

    private const SLUG_PATTERN = '/^[a-z0-9-]{1,64}$/';



    public function __construct(

        ValidatorInterface $validator,

        private readonly ExplorerManager $explorerManager,

        private readonly VaultPathResolver $pathResolver,

        private readonly PkbPermissionResolver $permissionResolver,

    ) {

        parent::__construct($validator);

    }



    public function getVaultRepository(): VaultRepository

    {

        return $this->getEntityManager()->getRepository(Vault::class);

    }



    public function getVaultMemberRepository(): VaultMemberRepository

    {

        return $this->getEntityManager()->getRepository(VaultMember::class);

    }



    /** @return list<array<string, mixed>> */

    public function listVaultsForUser(User $user): array

    {

        $vaults = $this->getVaultRepository()->findAccessibleByUser($user);



        return array_map(fn (Vault $vault) => $this->serializeVaultSummary($vault, $user), $vaults);

    }



    public function getVault(int $id, User $user): Vault

    {

        $vault = $this->getVaultRepository()->find($id);

        if (!$vault instanceof Vault) {

            throw new NotFoundHttpException('Vault не найден');

        }

        if (!$this->permissionResolver->canViewVault($vault, $user)) {

            throw new AccessDeniedHttpException('Нет доступа к vault');

        }



        return $vault;

    }



    public function createVault(User $user, array $data): Vault

    {

        $name = $this->normalizeName($data['name'] ?? null);

        $slug = $this->resolveSlug($user, $data['slug'] ?? null, $name);

        $rootPath = $this->resolveRootPath($slug, $data['rootPath'] ?? $data['root_path'] ?? null);



        $vault = new Vault();

        $vault->setOwner($user);

        $vault->setName($name);

        $vault->setSlug($slug);

        $vault->setRootPath($rootPath);

        $vault->setIsPersonal(true);



        $this->initializeVaultFilesystem($user, $vault);



        $em = $this->getEntityManager();

        $em->persist($vault);

        $em->flush();



        return $vault;

    }



    public function updateVault(Vault $vault, User $user, array $data): Vault

    {

        if (!$this->permissionResolver->canUpdateVault($vault, $user)) {

            throw new AccessDeniedHttpException('Нет прав на изменение vault');

        }



        if (array_key_exists('name', $data)) {

            $vault->setName($this->normalizeName($data['name']));

        }



        $em = $this->getEntityManager();

        $em->flush();



        return $vault;

    }



    public function deleteVault(Vault $vault, User $user, bool $deleteFiles = false): void

    {

        if (!$this->permissionResolver->canDeleteVault($vault, $user)) {

            throw new AccessDeniedHttpException('Нет прав на удаление vault');

        }



        $owner = $vault->getOwner();

        $rootPath = $vault->getRootPath();

        $em = $this->getEntityManager();

        $em->remove($vault);

        $em->flush();



        if ($deleteFiles && $owner instanceof User) {

            try {

                $this->explorerManager->delete($owner, rtrim($rootPath, '/'), true);

            } catch (\Throwable) {

                // Vault unregistered; filesystem cleanup is best-effort.

            }

        }

    }



    /** @return list<array<string, mixed>> */

    public function listVaultMembers(Vault $vault, User $user): array

    {

        if (!$this->permissionResolver->canManageMembers($vault, $user)) {

            throw new AccessDeniedHttpException('Нет прав на просмотр участников vault');

        }



        return $this->serializeVaultMembers($vault);

    }



    public function inviteVaultMember(Vault $vault, User $inviter, string $emailOrUserId, string $role): VaultMember

    {

        if (!$this->permissionResolver->canManageMembers($vault, $inviter)) {

            throw new AccessDeniedHttpException('Нет прав на управление участниками');

        }



        $memberRole = $this->parseVaultMemberRole($role);

        $target = $this->resolveUserByEmailOrId($emailOrUserId);



        if ($target->getId() === $vault->getOwner()?->getId()) {

            throw new BadRequestHttpException('Владелец vault не добавляется в участники');

        }



        foreach ($vault->getMembers() as $existing) {

            if ($existing->getUser()?->getId() === $target->getId()) {

                $existing->setRole($memberRole);

                $this->getEntityManager()->flush();



                return $existing;

            }

        }



        $member = new VaultMember();

        $member->setUser($target);

        $member->setRole($memberRole);

        $vault->addMember($member);



        $em = $this->getEntityManager();

        $em->persist($member);

        $em->flush();



        return $member;

    }



    public function updateVaultMemberRole(Vault $vault, User $actor, int $userId, string $role): VaultMember

    {

        if (!$this->permissionResolver->canManageMembers($vault, $actor)) {

            throw new AccessDeniedHttpException('Нет прав на управление участниками');

        }



        $member = $this->findVaultMember($vault, $userId);

        $member->setRole($this->parseVaultMemberRole($role));

        $this->getEntityManager()->flush();



        return $member;

    }



    public function removeVaultMember(Vault $vault, User $actor, int $userId): void

    {

        if (!$this->permissionResolver->canManageMembers($vault, $actor)) {

            throw new AccessDeniedHttpException('Нет прав на управление участниками');

        }



        if ($userId === $vault->getOwner()?->getId()) {

            throw new BadRequestHttpException('Нельзя удалить владельца vault');

        }



        $member = $this->findVaultMember($vault, $userId);

        $vault->removeMember($member);

        $this->getEntityManager()->remove($member);

        $this->getEntityManager()->flush();

    }



    /** @return array<string, mixed> */

    public function serializeVaultSummary(Vault $vault, User $viewer): array

    {

        return [

            'id' => $vault->getId(),

            'name' => $vault->getName(),

            'slug' => $vault->getSlug(),

            'root_path' => $vault->getRootPath(),

            'is_personal' => $vault->isPersonal(),

            'is_owner' => $this->permissionResolver->isOwner($vault, $viewer),

            'role' => $this->resolveVaultRoleLabel($vault, $viewer),

            'permissions' => $this->serializeVaultPermissions($vault, $viewer),

            'index_version' => $vault->getIndexVersion(),

            'index_stale' => $vault->isIndexStale(),

            'updated_at' => $vault->getUpdatedAt('Y-m-d H:i:s'),

        ];

    }



    /** @return array<string, mixed> */

    public function serializeVaultDetail(Vault $vault, User $viewer): array

    {

        return [

            ...$this->serializeVaultSummary($vault, $viewer),

            'config' => $this->readVaultConfig($vault, $viewer),

            'created_at' => $vault->getCreatedAt('Y-m-d H:i:s'),

        ];

    }



    /** @return array<string, mixed>|null */

    public function readVaultConfig(Vault $vault, User $user): ?array

    {

        if (!$this->permissionResolver->canReadFiles($vault, $user)) {

            return null;

        }



        $fileUser = $vault->getOwner();

        if (!$fileUser instanceof User) {

            return null;

        }



        $configUri = $this->pathResolver->toExplorerUri($vault, '.xos-vault/config.json');



        try {

            $absolute = $this->explorerManager->readAbsolutePath($fileUser, $configUri);

            if (!is_file($absolute)) {

                return null;

            }

            $raw = file_get_contents($absolute);

            if (false === $raw || '' === $raw) {

                return null;

            }

            /** @var array<string, mixed>|null $decoded */

            $decoded = json_decode($raw, true);



            return is_array($decoded) ? $decoded : null;

        } catch (\Throwable) {

            return null;

        }

    }



    /** @return list<array<string, mixed>> */

    private function serializeVaultMembers(Vault $vault): array

    {

        $members = [[

            'user_id' => $vault->getOwner()?->getId(),

            'email' => $vault->getOwner()?->getEmail(),

            'alias' => $vault->getOwner()?->getAlias(),

            'role' => 'owner',

            'is_owner' => true,

        ]];



        foreach ($vault->getMembers() as $member) {

            $members[] = [

                'user_id' => $member->getUser()?->getId(),

                'email' => $member->getUser()?->getEmail(),

                'alias' => $member->getUser()?->getAlias(),

                'role' => $member->getRole()->value,

                'is_owner' => false,

            ];

        }



        return $members;

    }



    /** @return array<string, bool> */

    private function serializeVaultPermissions(Vault $vault, User $viewer): array

    {

        return [

            'can_view' => $this->permissionResolver->canViewVault($vault, $viewer),

            'can_read_files' => $this->permissionResolver->canReadFiles($vault, $viewer),

            'can_write' => $this->permissionResolver->canWriteFiles($vault, $viewer),

            'can_manage_members' => $this->permissionResolver->canManageMembers($vault, $viewer),

            'can_update' => $this->permissionResolver->canUpdateVault($vault, $viewer),

            'can_delete' => $this->permissionResolver->canDeleteVault($vault, $viewer),

            'can_rebuild_index' => $this->permissionResolver->canRebuildIndex($vault, $viewer),

        ];

    }



    /** @return 'owner'|'reader'|'editor'|null */

    private function resolveVaultRoleLabel(Vault $vault, User $viewer): ?string

    {

        if ($this->permissionResolver->isOwner($vault, $viewer)) {

            return 'owner';

        }



        return $this->permissionResolver->resolveRole($vault, $viewer)?->value;

    }



    private function findVaultMember(Vault $vault, int $userId): VaultMember

    {

        foreach ($vault->getMembers() as $member) {

            if ($member->getUser()?->getId() === $userId) {

                return $member;

            }

        }



        throw new NotFoundHttpException('Участник vault не найден');

    }



    private function parseVaultMemberRole(string $role): VaultMemberRole

    {

        $parsed = VaultMemberRole::tryFromString($role);

        if (null === $parsed) {

            throw new BadRequestHttpException('role: reader или editor');

        }



        return $parsed;

    }



    private function resolveUserByEmailOrId(string $emailOrUserId): User

    {

        $value = trim($emailOrUserId);

        if ('' === $value) {

            throw new BadRequestHttpException('Укажите email или userId');

        }



        /** @var UserRepository $users */

        $users = $this->getEntityManager()->getRepository(User::class);



        if (ctype_digit($value)) {

            $user = $users->find((int) $value);

            if (!$user instanceof User) {

                throw new NotFoundHttpException('Пользователь не найден');

            }



            return $user;

        }



        $user = $users->findOneBy(['email' => $value]);

        if (!$user instanceof User) {

            throw new NotFoundHttpException('Пользователь с таким email не найден');

        }



        return $user;

    }



    private function initializeVaultFilesystem(User $user, Vault $vault): void

    {

        $root = rtrim($vault->getRootPath(), '/');

        $this->explorerManager->mkdir($user, $root);

        $this->explorerManager->mkdir($user, $root.'/.xos-vault');

        $this->explorerManager->mkdir($user, $root.'/Notes');

        $this->explorerManager->mkdir($user, $root.'/Templates');

        $this->explorerManager->mkdir($user, $root.'/attachments');



        $now = (new \DateTimeImmutable())->format('c');

        $config = [

            'version' => 1,

            'created_at' => $now,

            'name' => $vault->getName(),

            'defaultNoteFolder' => 'Notes',

            'templatesFolder' => 'Templates',

            'attachmentFolder' => 'attachments',

            'dailyNotes' => [

                'enabled' => false,

                'format' => 'YYYY-MM-DD',

                'folder' => 'Daily',

            ],

            'wikilink' => [

                'caseSensitive' => false,

                'extension' => '.md',

            ],

        ];



        $this->explorerManager->writeText(

            $user,

            $root.'/.xos-vault/config.json',

            json_encode($config, JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),

        );

    }



    private function resolveSlug(User $user, mixed $requestedSlug, string $name): string

    {

        if (null !== $requestedSlug && '' !== trim((string) $requestedSlug)) {

            $slug = strtolower(trim((string) $requestedSlug));

            if (!preg_match(self::SLUG_PATTERN, $slug)) {

                throw new BadRequestHttpException('Slug должен соответствовать [a-z0-9-]{1,64}');

            }



            if ($this->getVaultRepository()->findOneByOwnerAndSlug($user, $slug) instanceof Vault) {

                throw new ConflictHttpException('Vault с таким slug уже существует');

            }



            return $slug;

        }



        $base = $this->generateSlugFromName($name);

        $slug = $base;

        $suffix = 2;

        while ($this->getVaultRepository()->findOneByOwnerAndSlug($user, $slug) instanceof Vault) {

            $candidate = $base.'-'.$suffix;

            if (strlen($candidate) > 64) {

                $candidate = substr($base, 0, max(1, 64 - strlen((string) $suffix) - 1)).'-'.$suffix;

            }

            $slug = $candidate;

            ++$suffix;

        }



        return $slug;

    }



    private function generateSlugFromName(string $name): string

    {

        $slug = strtolower(trim($name));

        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';

        $slug = trim((string) $slug, '-');



        if ('' === $slug) {

            $slug = 'vault';

        }



        return substr($slug, 0, 64);

    }



    private function resolveRootPath(string $slug, mixed $customRootPath): string

    {

        if (null !== $customRootPath && '' !== trim((string) $customRootPath)) {

            $rootPath = trim((string) $customRootPath);

            if (!str_starts_with($rootPath, 'home://')) {

                throw new BadRequestHttpException('rootPath должен начинаться с home://');

            }



            return rtrim($rootPath, '/').'/';

        }



        return 'home://Vaults/'.$slug.'/';

    }



    private function normalizeName(mixed $name): string

    {

        $value = trim((string) ($name ?? ''));

        if ('' === $value) {

            throw new BadRequestHttpException('name обязателен');

        }



        return $value;

    }

}


