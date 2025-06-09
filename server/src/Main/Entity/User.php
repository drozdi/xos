<?php

namespace Main\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;

use Main\Entity\User\Access;
use Main\Entity\User\Group as UserGroup;
use Main\Entity\Group as MainGroup;
use Main\Repository\UserRepository;

use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\LegacyPasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Validator\Constraints as Assert;


#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'main_user')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface, LegacyPasswordAuthenticatedUserInterface, \Stringable {
    public const ROLE_USER = 'ROLE_USER';
    public const ROLE_ADMIN = 'ROLE_ADMIN';
    public const ROLE_DEFAULT = 'ROLE_USER';
    public const ROLE_SUPER_ADMIN = 'ROLE_SUPER_ADMIN';

    #[ORM\Id, ORM\GeneratedValue, ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'login', length: 191, unique: true)]
    #[Assert\NotBlank(
        message: 'Login должен быть указан'
    )]
    private ?string $login = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: 'date_register', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateRegister = null;

    #[ORM\Column(name: 'last_login', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastLogin = null;

    #[ORM\Column(name: 'email', length: 255, nullable: true)]
    #[Assert\Email(
        message: 'Email {{ value }} не является валидным email.',
    )]
    private ?string $email = null;

    #[ORM\Column(name: 'last_ip', length: 40, nullable: true)]
    private ?string $lastIp = null;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $active = true;

    #[ORM\Column(name: 'loocked', type: Types::BOOLEAN, options: ["default" => false])]
    private ?bool $loocked = false;

    #[ORM\Column(name: 'phone', length: 255, nullable: true)]
    private ?string $phone = null;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: 'alias', length: 255, nullable: true)]
    #[Assert\NotBlank(
        message: 'Псевдоним должен быть указан'
    )]
    private ?string $alias = null;

    #[ORM\Column(name: 'first_name', length: 255, nullable: true)]
    private ?string $firstName = null;

    #[ORM\Column(name: 'second_name', length: 255, nullable: true)]
    private ?string $secondName = null;

    #[ORM\Column(name: 'patronymic', length: 255, nullable: true)]
    private ?string $patronymic = null;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'stored_hash', length: 32, unique: true, nullable: true)]
    private ?string $storedHash;

    #[ORM\Column(name: 'checkword', length: 32, nullable: true, unique: true)]
    private ?string $checkword;

    #[ORM\Column(name: 'password', length: 255, nullable: true)]
    private ?string $password;

    #[ORM\Column(name: 'salt', length: 255, nullable: true)]
    protected ?string $salt = null;

    #[ORM\Column(name: 'gender', length: 1, nullable: true, options: ["default" => 'N'])]
    private ?string $gender = "N";

    #[ORM\Column(name: 'login_attempts', type: Types::INTEGER, options: ["default" => 0])]
    private $loginAttempts = 0;

    #[ORM\Column(name: 'country', length: 10, options: ["default" => 'RU'])]
    private $country = 'RU';

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    #[ORM\ManyToOne(targetEntity: OU::class)]
    #[ORM\JoinColumn(name: "ou_id", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?OU $ou = null;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Access::class)]
    private Collection $accesses;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: UserGroup::class)]
    private Collection $groups;

    //#[ORM\OneToMany(mappedBy: 'user', targetEntity: StoredAuth::class)]
    private Collection $storedAuths;

    /**
     * @var string[]
     */
    #[ORM\Column(name: "roles", type: Types::JSON)]
    private array $roles = [];

    /**
     * @var string[]
     */
    #[ORM\Column(name: "options", type: Types::JSON)]
    private array $options = [];

    public function __construct () {
        $this->children = new ArrayCollection();
        $this->accesses = new ArrayCollection();
        $this->groups = new ArrayCollection();
        $this->storedAuths = new ArrayCollection();
    }
    public function getId(): ?int {
        return $this->id;
    }
    public function getLogin(): ?string {
        return $this->login;
    }
    public function setLogin(string $login): self {
        $this->login = $login;

        return $this;
    }
    public function getXTimestamp(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp(\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }
    public function getEmail(): ?string {
        return $this->email;
    }
    public function setEmail(string $email): self {
        $this->email = $email;

        return $this;
    }
    public function getDateRegister(?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->dateRegister) {
            return $this->dateRegister->format($format);
        }
        return $this->dateRegister;
    }
    public function setDateRegister(\DateTimeInterface $dateRegister): self {
        $this->dateRegister = $dateRegister;
        return $this;
    }
    public function getLastLogin (?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->lastLogin) {
            return $this->lastLogin->format($format);
        }
        return $this->lastLogin;
    }
    public function setLastLogin (\DateTimeInterface $lastLogin): self {
        $this->lastLogin = $lastLogin;
        return $this;
    }
    public function getLastIp (): ?string {
        return $this->lastIp;
    }
    public function setLastIp (?string $lastIp): self {
        $this->lastIp = $lastIp;
        return $this;
    }
    public function isActive (): bool {
        return $this->active;
    }
    public function setActive (bool$active): self {
        $this->active = $active;
        return $this;
    }
    public function getActiveFrom (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeFrom->format($format);
        }
        return $this->activeFrom;
    }
    public function setActiveFrom (?\DateTimeInterface $activeFrom = null): self {
        $this->activeFrom = $activeFrom;
        return $this;
    }
    public function getActiveTo (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeTo->format($format);
        }
        return $this->activeTo;
    }
    public function setActiveTo (?\DateTimeInterface $activeTo = null): self {
        $this->activeTo = $activeTo;
        return $this;
    }
    public function isLoocked (): bool {
        return $this->loocked;
    }
    public function setLoocked (bool$loocked): self {
        $this->loocked = $loocked;
        return $this;
    }
    public function getStoredHash (): ?string {
        return $this->storedHash;
    }
    public function setStoredHash (?string$storedHash): self {
        $this->storedHash = $storedHash;
        return $this;
    }
    public function getCheckword (): ?string {
        return $this->checkword;
    }
    public function setCheckword (string $checkword): self {
        $this->checkword = $checkword;

        return $this;
    }
    public function getPhone(): ?string {
        return $this->phone;
    }
    public function setPhone(string $phone): self {
        $this->phone = $phone;

        return $this;
    }
    public function getAlias(): ?string {
        return $this->alias;
    }
    public function setAlias(string $alias): self {
        $this->alias = $alias;
        return $this;
    }
    public function getFirstName(): ?string {
        return $this->firstName;
    }
    public function setFirstName(string $firstName): self {
        $this->firstName = $firstName;
        return $this;
    }
    public function getSecondName(): ?string {
        return $this->secondName;
    }
    public function setSecondName(string $secondName): self {
        $this->secondName = $secondName;
        return $this;
    }
    public function getPatronymic(): ?string {
        return $this->patronymic;
    }
    public function setPatronymic(string $patronymic): self {
        $this->patronymic = $patronymic;

        return $this;
    }
    public function getDescription(): ?string {
        return $this->description;
    }
    public function setDescription(string $description): self {
        $this->description = $description;

        return $this;
    }
    public function getPassword (): string {
        return $this->password;
    }
    /**
     * @see PasswordAuthenticatedUserInterface
     */
    public function setPassword (string$password): self {
        $this->password = $password;
        return $this;
    }
    public function getGender (): string {
        return $this->gender;
    }
    public function setGender (string$gender): self {
        $this->gender = $gender;
        return $this;
    }
    public function getLoginAttempts (): int {
        return $this->loginAttempts;
    }
    public function setLoginAttempts (int$loginAttempts): self {
        $this->loginAttempts = $loginAttempts;
        return $this;
    }
    public function getCountry (): string {
        return $this->country;
    }
    public function setCountry (string$country): self {
        $this->country = $country;

        return $this;
    }

    public function getOu(): ?OU {
        return $this->ou;
    }
    public function setOu(?OU $ou): self {
        $this->ou = $ou;
        return $this;
    }

    public function setParent (?self $parent = null): self {
        if ($this->parent && $this->parent !== $parent) {
            $this->parent->removeChild($this);
        }
        $this->parent = $parent;
        if ($this->parent) {
            $this->parent->addChild($this);
        }
        return $this;
    }
    public function getParent (): ?self {
        return $this->parent;
    }
    /**
     * @return Collection<int, User>
     */
    public function getChildren () {
        return $this->children;
    }
    public function addChild (self $child): self {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }
        return $this;
    }
    public function removeChild (self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, UserGroup>
     */
    public function getGroups(): Collection {
        return $this->groups;
    }
    public function addGroup(UserGroup $group): self {
        if (!$this->groups->contains($group)) {
            $this->groups->add($group);
            $group->setUser($this);
        }
        return $this;
    }
    public function removeGroup(UserGroup $group): self {
        if ($this->groups->removeElement($group)) {
            // set the owning side to null (unless already changed)
            if ($group->getUser() === $this) {
                $group->setUser(null);
            }
        }
        return $this;
    }
    public function newGroup (MainGroup $group): UserGroup {
        $this->addGroup($gu = new UserGroup());
        $gu->setGroup($group);
        return $gu;
    }
    public function isInclude (MainGroup $group): bool {
        $res = false;
        foreach ($this->groups as $ug) {
            $res = $res || $ug->isGroup($group);
        }
        return $res;
    }


    /**
     * @return Collection<int, StoredAuth>
     */
    public function getStoredAuths(): Collection {
        return $this->storedAuths;
    }
    public function addStoredAuth(StoredAuth $storedAuth): self {
        if (!$this->storedAuths->contains($storedAuth)) {
            $this->storedAuths->add($storedAuth);
            $storedAuth->setUser($this);
        }
        return $this;
    }
    public function removeStoredAuth(StoredAuth $storedAuth): self {
        if ($this->storedAuths->removeElement($storedAuth)) {
            // set the owning side to null (unless already changed)
            if ($storedAuth->getUser() === $this) {
                $storedAuth->setUser(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Access>
     */
    public function getAccesses (): Collection {
        return $this->accesses;
    }
    public function addAccess(Access $access): self {
        if (!$this->accesses->contains($access)) {
            $this->accesses->add($access);
            $access->setUser($this);
        }
        return $this;
    }
    public function removeAccess(Access $access): self {
        if ($this->accesses->removeElement($access)) {
            // set the owning side to null (unless already changed)
            if ($access->getUser() === $this) {
                $access->setUser(null);
            }
        }
        return $this;
    }
    public function newAccess (Claimant $claimant): Access {
        $this->addAccess($access = new User\Access());
        $access->setClaimant($claimant);
        return $access;
    }

    public function getRoles(): array {
        $roles = $this->roles;
        // guarantee every user at least has ROLE_USER
        $roles[] = self::ROLE_USER;
        return array_unique($roles);
    }
    public function setRoles(array $roles): self {
        $this->roles = $roles;
        return $this;
    }
    public function addRole (string $role): void {
        $role = strtoupper($role);

        if ($role === static::ROLE_DEFAULT) {
            return;
        }

        if (!\in_array($role, $this->roles, true)) {
            $this->roles[] = $role;
        }
    }
    public function hasRole(string $role): bool {
        return \in_array(strtoupper($role), $this->getRoles(), true);
    }

    public function getOptions (): array {
        return $this->options;
    }
    public function setOptions (array $options): self {
        $this->options = $options;
        return $this;
    }
    public function addOptions (array $options): self {
        $this->options = array_merge($this->options, $options);
        return $this;
    }
    public function getOption (string $name, $default = null): mixed {
        $arName = explode(".", $name);
        $val = $this->options;
        foreach ($arName as $n) {
            $val = $val[$n] ?: array();
        }
        return $val ?: $default;
    }
    public function setOption (string $name, $val): self {
        $arName = explode(".", $name);
        $arName = array_reverse($arName);
        foreach ($arName as $n) {
            $val = [$n => $val];
        }
        return $this->addOptions($val);
    }


    public function eraseCredentials(): void {
        // if you had a plainPassword property, you'd nullify it here
        // $this->plainPassword = null;
    }
    public function getUserIdentifier(): string {
        return (string)$this->login;
    }

    public function setSalt(?string $salt): self {
        $this->salt = $salt;
        return $this;
    }
    public function getSalt(): ?string {
        return null;
    }

    public function prePersist(): void {
        $this->xTimestamp = new \DateTime();
    }
    public function preUpdate(): void {
        $this->xTimestamp = new \DateTime();
    }


    public function __toString(): string {
        return sprintf("%s (%s)", $this->login, $this->alias);
    }
    /**
     * @return mixed[]
     */
    public function __serialize(): array {
        return [
            $this->id,
            $this->password,
            $this->salt,
            $this->login,
            $this->active,
            $this->email
        ];
    }

    /**
     * @param mixed[] $data
     */
    public function __unserialize(array $data): void {
        [
            $this->id,
            $this->password,
            $this->salt,
            $this->login,
            $this->active,
            $this->email
        ] = $data;
    }
}
