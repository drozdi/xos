<?php

namespace SchoolTask\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use SchoolTask\Repository\EpGroupRepository;

#[ORM\Entity(repositoryClass: EpGroupRepository::class)]
#[ORM\Table(name: 'st_ep_group')]
#[ORM\HasLifecycleCallbacks]
class EpGroup
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?self $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\ManyToOne(targetEntity: EpSubject::class)]
    #[ORM\JoinColumn(name: 'subject_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?EpSubject $subject = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ['default' => 100])]
    private int $sort = 100;

    #[ORM\Column(name: '`level`', type: Types::INTEGER, options: ['default' => 0])]
    private int $level = 0;

    #[ORM\Column(name: 'name', length: 255)]
    private string $name = '';

    #[ORM\Column(name: 'code', length: 191, unique: true)]
    private string $code = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $graduated = false;

    #[ORM\Column(name: 'graduated_year', type: Types::SMALLINT, nullable: true)]
    private ?int $graduatedYear = null;

    /** Выпускная параллель: классы при переводе выпускаются, а не повышаются. */
    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $graduates = false;

    #[ORM\OneToMany(mappedBy: 'group', targetEntity: EpGroupUser::class, orphanRemoval: true)]
    private Collection $users;

    public function __construct()
    {
        $this->children = new ArrayCollection();
        $this->users = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getXTimestamp(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }

        return $this->xTimestamp;
    }

    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self
    {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent): self
    {
        if ($this->parent && $this->parent !== $parent) {
            $this->parent->removeChild($this);
        }
        $this->parent = $parent;
        if ($this->parent) {
            $this->parent->addChild($this);
        }
        $level = 0;
        if ($this->parent instanceof self) {
            $level = $this->parent->getLevel() + 1;
        }
        $this->setLevel($level);

        return $this;
    }

    public function addChild(self $child): self
    {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }

        return $this;
    }

    public function removeChild(self $child): self
    {
        if ($this->children->removeElement($child) && $child->getParent() === $this) {
            $child->setParent(null);
            $child->setLevel(0);
        }

        return $this;
    }

    /** @return Collection<int, self> */
    public function getChildren(): Collection
    {
        return $this->children;
    }

    public function getSubject(): ?EpSubject
    {
        return $this->subject;
    }

    public function setSubject(?EpSubject $subject): self
    {
        $this->subject = $subject;

        return $this;
    }

    public function getSort(): int
    {
        return $this->sort;
    }

    public function setSort(int $sort): self
    {
        $this->sort = $sort;

        return $this;
    }

    public function getLevel(): int
    {
        return $this->level;
    }

    public function setLevel(int $level): self
    {
        $this->level = $level;
        foreach ($this->children as $child) {
            $child->setLevel($this->level + 1);
        }

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getCode(): string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function isGraduated(): bool
    {
        return $this->graduated;
    }

    public function setGraduated(bool $graduated): self
    {
        $this->graduated = $graduated;

        return $this;
    }

    public function getGraduatedYear(): ?int
    {
        return $this->graduatedYear;
    }

    public function setGraduatedYear(?int $graduatedYear): self
    {
        $this->graduatedYear = $graduatedYear;

        return $this;
    }

    public function isGraduates(): bool
    {
        return $this->graduates;
    }

    public function setGraduates(bool $graduates): self
    {
        $this->graduates = $graduates;

        return $this;
    }

    /** @return Collection<int, EpGroupUser> */
    public function getUsers(): Collection
    {
        return $this->users;
    }

    public function addUser(EpGroupUser $user): self
    {
        if (!$this->users->contains($user)) {
            $this->users->add($user);
            $user->setGroup($this);
        }

        return $this;
    }

    public function newUser(User $user): EpGroupUser
    {
        $this->addUser($groupUser = new EpGroupUser());
        $groupUser->setUser($user);

        return $groupUser;
    }

    public function removeUser(EpGroupUser $user): self
    {
        if ($this->users->removeElement($user) && $user->getGroup() === $this) {
            $user->setGroup(null);
        }

        return $this;
    }

    public function isMember(User $user): bool
    {
        foreach ($this->users as $groupUser) {
            if ($groupUser->isUser($user)) {
                return true;
            }
        }

        return false;
    }

    #[ORM\PrePersist]
    public function prePersist(): void
    {
        $this->xTimestamp = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function preUpdate(): void
    {
        $this->xTimestamp = new \DateTime();
    }
}
