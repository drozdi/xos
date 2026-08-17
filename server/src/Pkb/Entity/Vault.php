<?php

namespace Pkb\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Pkb\Repository\VaultRepository;

#[ORM\Entity(repositoryClass: VaultRepository::class)]
#[ORM\Table(name: 'pkb_vault')]
#[ORM\UniqueConstraint(name: 'UNIQ_pkb_vault_owner_slug', columns: ['owner_id', 'slug'])]
#[ORM\Index(name: 'IDX_pkb_vault_owner', columns: ['owner_id'])]
#[ORM\HasLifecycleCallbacks]
class Vault
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private ?User $owner = null;

    #[ORM\Column(length: 255)]
    private string $name = '';

    #[ORM\Column(length: 64)]
    private string $slug = '';

    #[ORM\Column(name: 'root_path', length: 512)]
    private string $rootPath = '';

    #[ORM\Column(name: 'is_personal', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $isPersonal = true;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\Column(name: 'index_version', type: Types::INTEGER, options: ['default' => 0])]
    private int $indexVersion = 0;

    #[ORM\Column(name: 'index_stale', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $indexStale = false;

    /** @var Collection<int, VaultMember> */
    #[ORM\OneToMany(mappedBy: 'vault', targetEntity: VaultMember::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $members;

    public function __construct()
    {
        $this->members = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTime();
        if (null === $this->createdAt) {
            $this->createdAt = $now;
        }
        $this->updatedAt = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->updatedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): self
    {
        $this->owner = $owner;

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

    public function getSlug(): string
    {
        return $this->slug;
    }

    public function setSlug(string $slug): self
    {
        $this->slug = $slug;

        return $this;
    }

    public function getRootPath(): string
    {
        return $this->rootPath;
    }

    public function setRootPath(string $rootPath): self
    {
        $this->rootPath = $rootPath;

        return $this;
    }

    public function isPersonal(): bool
    {
        return $this->isPersonal;
    }

    public function setIsPersonal(bool $isPersonal): self
    {
        $this->isPersonal = $isPersonal;

        return $this;
    }

    public function getCreatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->createdAt) {
            return $this->createdAt->format($format);
        }

        return $this->createdAt;
    }

    public function getUpdatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->updatedAt) {
            return $this->updatedAt->format($format);
        }

        return $this->updatedAt;
    }

    public function getIndexVersion(): int
    {
        return $this->indexVersion;
    }

    public function setIndexVersion(int $indexVersion): self
    {
        $this->indexVersion = $indexVersion;

        return $this;
    }

    public function isIndexStale(): bool
    {
        return $this->indexStale;
    }

    public function setIndexStale(bool $indexStale): self
    {
        $this->indexStale = $indexStale;

        return $this;
    }

    /** @return Collection<int, VaultMember> */
    public function getMembers(): Collection
    {
        return $this->members;
    }

    public function addMember(VaultMember $member): self
    {
        if (!$this->members->contains($member)) {
            $this->members->add($member);
            $member->setVault($this);
        }

        return $this;
    }

    public function removeMember(VaultMember $member): self
    {
        $this->members->removeElement($member);

        return $this;
    }
}
