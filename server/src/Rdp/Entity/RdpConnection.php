<?php

namespace Rdp\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Rdp\Repository\RdpConnectionRepository;

#[ORM\Entity(repositoryClass: RdpConnectionRepository::class)]
#[ORM\Table(name: 'rdp_connection')]
#[ORM\Index(name: 'IDX_rdp_connection_user', columns: ['user_id'])]
#[ORM\HasLifecycleCallbacks]
class RdpConnection
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(length: 120)]
    private string $name = '';

    #[ORM\Column(length: 255)]
    private string $host = '';

    #[ORM\Column]
    private int $port = 3389;

    #[ORM\Column(length: 16)]
    private string $zone = 'auto';

    #[ORM\Column(name: 'zone_detected', length: 16)]
    private string $zoneDetected = 'public';

    #[ORM\ManyToOne(targetEntity: RdpNetwork::class)]
    #[ORM\JoinColumn(name: 'network_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?RdpNetwork $network = null;

    #[ORM\ManyToOne(targetEntity: RdpNode::class)]
    #[ORM\JoinColumn(name: 'node_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?RdpNode $node = null;

    #[ORM\Column(length: 128)]
    private string $username = '';

    #[ORM\Column(length: 128)]
    private string $domain = '';

    #[ORM\Column(type: Types::TEXT)]
    private string $secret = '';

    #[ORM\Column(length: 16)]
    private string $security = 'nla';

    #[ORM\Column(name: 'ignore_cert')]
    private bool $ignoreCert = false;

    #[ORM\Column(name: 'cert_fingerprint', length: 128, nullable: true)]
    private ?string $certFingerprint = null;

    #[ORM\Column]
    private int $width = 1280;

    #[ORM\Column]
    private int $height = 720;

    #[ORM\Column]
    private int $dpi = 96;

    #[ORM\Column(name: 'color_depth')]
    private int $colorDepth = 16;

    #[ORM\Column(name: 'enable_clipboard')]
    private bool $enableClipboard = true;

    #[ORM\Column(name: 'enable_audio')]
    private bool $enableAudio = false;

    #[ORM\Column(name: 'enable_drive')]
    private bool $enableDrive = false;

    #[ORM\Column(name: 'keyboard_layout', length: 32)]
    private string $keyboardLayout = 'en-us-qwerty';

    #[ORM\Column(name: 'resize_method', length: 16)]
    private string $resizeMethod = 'reconnect';

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct(User $user)
    {
        $this->user = $user;
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

    public function getUser(): User
    {
        return $this->user;
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

    public function getHost(): string
    {
        return $this->host;
    }

    public function setHost(string $host): self
    {
        $this->host = $host;

        return $this;
    }

    public function getPort(): int
    {
        return $this->port;
    }

    public function setPort(int $port): self
    {
        $this->port = $port;

        return $this;
    }

    public function getZone(): string
    {
        return $this->zone;
    }

    public function setZone(string $zone): self
    {
        $this->zone = $zone;

        return $this;
    }

    public function getZoneDetected(): string
    {
        return $this->zoneDetected;
    }

    public function setZoneDetected(string $zoneDetected): self
    {
        $this->zoneDetected = $zoneDetected;

        return $this;
    }

    public function getNetwork(): ?RdpNetwork
    {
        return $this->network;
    }

    public function setNetwork(?RdpNetwork $network): self
    {
        $this->network = $network;

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

    public function getUsername(): string
    {
        return $this->username;
    }

    public function setUsername(string $username): self
    {
        $this->username = $username;

        return $this;
    }

    public function getDomain(): string
    {
        return $this->domain;
    }

    public function setDomain(string $domain): self
    {
        $this->domain = $domain;

        return $this;
    }

    public function getSecret(): string
    {
        return $this->secret;
    }

    public function setSecret(string $secret): self
    {
        $this->secret = $secret;

        return $this;
    }

    public function getSecurity(): string
    {
        return $this->security;
    }

    public function setSecurity(string $security): self
    {
        $this->security = $security;

        return $this;
    }

    public function ignoresCert(): bool
    {
        return $this->ignoreCert;
    }

    public function setIgnoreCert(bool $ignoreCert): self
    {
        $this->ignoreCert = $ignoreCert;

        return $this;
    }

    public function getCertFingerprint(): ?string
    {
        return $this->certFingerprint;
    }

    public function setCertFingerprint(?string $certFingerprint): self
    {
        $this->certFingerprint = $certFingerprint;

        return $this;
    }

    public function getWidth(): int
    {
        return $this->width;
    }

    public function setWidth(int $width): self
    {
        $this->width = $width;

        return $this;
    }

    public function getHeight(): int
    {
        return $this->height;
    }

    public function setHeight(int $height): self
    {
        $this->height = $height;

        return $this;
    }

    public function getDpi(): int
    {
        return $this->dpi;
    }

    public function setDpi(int $dpi): self
    {
        $this->dpi = $dpi;

        return $this;
    }

    public function getColorDepth(): int
    {
        return $this->colorDepth;
    }

    public function setColorDepth(int $colorDepth): self
    {
        $this->colorDepth = $colorDepth;

        return $this;
    }

    public function enablesClipboard(): bool
    {
        return $this->enableClipboard;
    }

    public function setEnableClipboard(bool $enableClipboard): self
    {
        $this->enableClipboard = $enableClipboard;

        return $this;
    }

    public function enablesAudio(): bool
    {
        return $this->enableAudio;
    }

    public function setEnableAudio(bool $enableAudio): self
    {
        $this->enableAudio = $enableAudio;

        return $this;
    }

    public function enablesDrive(): bool
    {
        return $this->enableDrive;
    }

    public function setEnableDrive(bool $enableDrive): self
    {
        $this->enableDrive = $enableDrive;

        return $this;
    }

    public function getKeyboardLayout(): string
    {
        return $this->keyboardLayout;
    }

    public function setKeyboardLayout(string $keyboardLayout): self
    {
        $this->keyboardLayout = $keyboardLayout;

        return $this;
    }

    public function getResizeMethod(): string
    {
        return $this->resizeMethod;
    }

    public function setResizeMethod(string $resizeMethod): self
    {
        $this->resizeMethod = $resizeMethod;

        return $this;
    }
}
