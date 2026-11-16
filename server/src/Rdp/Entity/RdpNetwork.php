<?php

namespace Rdp\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Rdp\Repository\RdpNetworkRepository;

#[ORM\Entity(repositoryClass: RdpNetworkRepository::class)]
#[ORM\Table(name: 'rdp_network')]
#[ORM\HasLifecycleCallbacks]
class RdpNetwork
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    private string $name = '';

    /** @var list<string> */
    #[ORM\Column(type: Types::JSON)]
    private array $cidrs = [];

    /** @var list<string> */
    #[ORM\Column(name: 'dns_suffixes', type: Types::JSON)]
    private array $dnsSuffixes = [];

    #[ORM\ManyToOne(targetEntity: RdpNode::class)]
    #[ORM\JoinColumn(name: 'node_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?RdpNode $node = null;

    #[ORM\Column]
    private bool $active = true;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'allow_clipboard')]
    private bool $allowClipboard = true;

    #[ORM\Column(name: 'allow_drive')]
    private bool $allowDrive = false;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    /** @var Collection<int, RdpNetworkGrant> */
    #[ORM\OneToMany(mappedBy: 'network', targetEntity: RdpNetworkGrant::class, cascade: ['persist'], orphanRemoval: true)]
    private Collection $grants;

    public function __construct()
    {
        $this->grants = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTime();
        $this->createdAt ??= $now;
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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getCidrs(): array
    {
        return $this->cidrs;
    }

    /**
     * @param list<string> $cidrs
     */
    public function setCidrs(array $cidrs): self
    {
        $this->cidrs = $cidrs;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getDnsSuffixes(): array
    {
        return $this->dnsSuffixes;
    }

    /**
     * @param list<string> $dnsSuffixes
     */
    public function setDnsSuffixes(array $dnsSuffixes): self
    {
        $this->dnsSuffixes = $dnsSuffixes;

        return $this;
    }

    public function getNode(): ?RdpNode
    {
        return $this->node;
    }

    public function setNode(?RdpNode $node): self
    {
        $this->node = $node;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;

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

    public function allowsClipboard(): bool
    {
        return $this->allowClipboard;
    }

    public function setAllowClipboard(bool $allowClipboard): self
    {
        $this->allowClipboard = $allowClipboard;

        return $this;
    }

    public function allowsDrive(): bool
    {
        return $this->allowDrive;
    }

    public function setAllowDrive(bool $allowDrive): self
    {
        $this->allowDrive = $allowDrive;

        return $this;
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): self
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    /**
     * @return Collection<int, RdpNetworkGrant>
     */
    public function getGrants(): Collection
    {
        return $this->grants;
    }
}
