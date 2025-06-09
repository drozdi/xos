<?php

namespace Main\Entity;

use Main\Entity\Group\Access;
use Main\Entity\User\Group as UserGroup;
use Main\Entity\User;
use Main\Repository\GroupRepository;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GroupRepository::class)]
#[ORM\Table(name: 'main_group')]
#[ORM\HasLifecycleCallbacks]
class Group
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "user_id", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: OU::class)]
    #[ORM\JoinColumn(name: "ou_id", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?OU $ou = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\Column(name: 'anonymous', type: Types::BOOLEAN, options: ["default" => false])]
    private ?bool $anonymous = false;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $active = true;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private ?int $sort = 100;

    #[ORM\Column(name: '`level`', type: Types::INTEGER, options: ["default" => 0])]
    private ?int $level = 0;

    #[ORM\Column(name: 'name', length: 255)]
    private ?string $name = null;

    #[ORM\Column(name: "code", length: 191, unique: true)]
    private ?string $code = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\OneToMany(mappedBy: 'group', targetEntity: Access::class)]
    private Collection $accesses;

    #[ORM\OneToMany(mappedBy: 'group', targetEntity: UserGroup::class)]
    private Collection $users;

    public function __construct() {
        $this->children = new ArrayCollection();
        $this->accesses = new ArrayCollection();
        $this->users = new ArrayCollection();
    }
    public function getId(): ?int {
        return $this->id;
    }
    public function getXTimestamp(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }
    public function getUser(): ?User {
        return $this->user;
    }
    public function setUser(?User $user): self {
        $this->user = $user;

        return $this;
    }
    public function isActive(): bool {
        return $this->active;
    }
    public function setActive(bool $active): self {
        $this->active = $active;
        return $this;
    }
    public function getActiveFrom(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeFrom->format($format);
        }
        return $this->activeFrom;
    }
    public function setActiveFrom(?\DateTimeInterface $activeFrom): self {
        $this->activeFrom = $activeFrom;
        return $this;
    }
    public function getActiveTo(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeTo) {
            return $this->activeTo->format($format);
        }
        return $this->activeTo;
    }
    public function setActiveTo(?\DateTimeInterface $activeTo): self {
        $this->activeTo = $activeTo;
        return $this;
    }
    public function getSort(): ?int {
        return $this->sort;
    }
    public function setSort(int $sort): self {
        $this->sort = $sort;

        return $this;
    }
    public function getLevel(): ?int {
        return $this->level;
    }
    public function setLevel(int $level): self {
        $this->level = $level;
        foreach ($this->children as $child) {
            $child->setLevel($this->level+1);
        }
        return $this;
    }
    public function isAnonymous(): bool {
        return $this->anonymous;
    }
    public function setAnonymous(bool $anonymous): self {
        $this->anonymous = $anonymous;

        return $this;
    }
    public function getName(): ?string {
        return $this->name;
    }
    public function setName(string $name): self {
        $this->name = $name;

        return $this;
    }
    public function getCode(): ?string {
        return $this->code;
    }
    public function setCode(string $code): self {
        $this->code = $code;

        return $this;
    }
    public function getDescription(): ?string {
        return $this->description;
    }
    public function setDescription(?string $description): self {
        $this->description = $description;

        return $this;
    }

    public function getOu(): ?OU {
        return $this->ou;
    }
    public function setOu(?OU $ou): self {
        $this->ou = $ou;
        foreach ($this->children as $child) {
            $child->setOU($ou);
        }
        return $this;
    }

    public function getParent(): ?self {
        return $this->parent;
    }
    public function setParent(?self $parent = null): self {
        if ($this->parent && $this->parent !== $parent) {
            $this->parent->removeChild($this);
        }
        $this->parent = $parent;
        if ($this->parent) {
            $this->parent->addChild($this);
        }
        $level = 0;
        if ($this->parent != null) {
            $this->setOu($this->parent->getOu());
            $level = $this->parent->getLevel() + 1;
        }
        $this->setLevel($level);
        return $this;
    }
    public function addChild (self $child): self {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }
        $child->setLevel($this->level + 1);
        $child->setOu($this->ou);
        return $this;
    }
    public function removeChild (self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
                $child->setLevel(0);
            }
        }
        return $this;
    }
    /**
     * @return Collection<int, Group>
     */
    public function getChildren () {
        return $this->children;
    }

    /**
     * @return Collection<int, Access>
     */
    public function getAccesses(): Collection {
        return $this->accesses;
    }
    public function addAccess(Access $access): self {
        if (!$this->accesses->contains($access)) {
            $this->accesses->add($access);
            $access->setGroup($this);
        }
        return $this;
    }
    public function newAccess (Claimant $claimant): Access {
        $this->addAccess($access = new Access());
        $access->setClaimant($claimant);
        return $access;
    }
    public function removeAccess(Access $access): self {
        if ($this->accesses->removeElement($access)) {
            // set the owning side to null (unless already changed)
            if ($access->getGroup() === $this) {
                $access->setGroup(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, UserGroup>
     */
    public function getUsers(): Collection {
        return $this->users;
    }
    public function addUser(UserGroup $user): self {
        if (!$this->users->contains($user)) {
            $this->users->add($user);
            $user->setGroup($this);
        }
        return $this;
    }
    public function newUser (User $user): UserGroup {
        $this->addUser($gu = new UserGroup());
        $gu->setUser($user);
        return $gu;
    }
    public function removeUser(UserGroup $user): self {
        if ($this->users->removeElement($user)) {
            // set the owning side to null (unless already changed)
            if ($user->getGroup() === $this) {
                $user->setGroup(null);
            }
        }

        return $this;
    }
    public function isInclude (User $user): bool {
        $res = false;
        foreach ($this->users as $ug) {
            $res = $res || $ug->isUser($user);
        }
        return $res;
    }
    public function __toString(): string {
        return sprintf("%s (%s)", $this->name, $this->code);
    }
    public function prePersist(): void {
        $this->xTimestamp = new \DateTime();
    }
    public function preUpdate(): void {
        $this->xTimestamp = new \DateTime();
    }
}
