<?php

namespace Samba\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Samba\Repository\SambaServerRepository;

#[ORM\Entity(repositoryClass: SambaServerRepository::class)]
#[ORM\Table(name: 'samba_server')]
#[ORM\Index(name: 'IDX_samba_server_owner', columns: ['owner_id'])]
#[ORM\HasLifecycleCallbacks]
class SambaServer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private User $owner;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\Column(length: 120)]
    private string $name = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(length: 16)]
    private string $role = 'ad_dc';

    /** @var list<string> */
    #[ORM\Column(type: Types::JSON)]
    private array $capabilities = ['dc'];

    #[ORM\Column(length: 16)]
    private string $status = 'new';

    #[ORM\Column(name: 'expected_timezone', length: 64)]
    private string $expectedTimezone = 'UTC';

    #[ORM\Column(type: Types::JSON, nullable: true)]
    private ?array $detected = null;

    #[ORM\Column(name: 'last_seen_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $lastSeenAt = null;

    #[ORM\Column]
    private int $generation = 0;

    #[ORM\Column(name: 'applied_generation')]
    private int $appliedGeneration = 0;

    #[ORM\Column(name: 'time_skew_ms', nullable: true)]
    private ?int $timeSkewMs = null;

    #[ORM\Column(name: 'agent_version', length: 32, nullable: true)]
    private ?string $agentVersion = null;

    #[ORM\Column(name: 'protocol_version', length: 16, nullable: true)]
    private ?string $protocolVersion = null;

    #[ORM\Column(name: 'device_id', nullable: true)]
    private ?int $deviceId = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct(User $owner)
    {
        $this->owner = $owner;
        $this->createdBy = $owner;
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

    public function getOwner(): User
    {
        return $this->owner;
    }

    public function setOwner(User $owner): self
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): self
    {
        $this->role = $role;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getCapabilities(): array
    {
        return $this->capabilities;
    }

    /**
     * @param list<string> $capabilities
     */
    public function setCapabilities(array $capabilities): self
    {
        $this->capabilities = $capabilities;

        return $this;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): self
    {
        $this->status = $status;

        return $this;
    }

    public function getDetected(): ?array
    {
        return $this->detected;
    }

    /**
     * @param array<string, mixed>|null $detected
     */
    public function setDetected(?array $detected): self
    {
        $this->detected = $detected;

        return $this;
    }

    public function getLastSeenAt(): ?\DateTimeInterface
    {
        return $this->lastSeenAt;
    }

    public function setLastSeenAt(?\DateTimeInterface $lastSeenAt): self
    {
        $this->lastSeenAt = $lastSeenAt;

        return $this;
    }

    public function getExpectedTimezone(): string
    {
        return $this->expectedTimezone;
    }

    public function setExpectedTimezone(string $expectedTimezone): self
    {
        $this->expectedTimezone = $expectedTimezone;

        return $this;
    }

    public function getDeviceId(): ?int
    {
        return $this->deviceId;
    }

    public function getTimeSkewMs(): ?int
    {
        return $this->timeSkewMs;
    }

    public function setTimeSkewMs(?int $timeSkewMs): self
    {
        $this->timeSkewMs = $timeSkewMs;

        return $this;
    }

    public function setAgentVersion(?string $agentVersion): self
    {
        $this->agentVersion = $agentVersion;

        return $this;
    }

    public function setProtocolVersion(?string $protocolVersion): self
    {
        $this->protocolVersion = $protocolVersion;

        return $this;
    }
}
