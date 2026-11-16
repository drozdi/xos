<?php

namespace Rdp\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Rdp\Repository\RdpNodeRepository;

#[ORM\Entity(repositoryClass: RdpNodeRepository::class)]
#[ORM\Table(name: 'rdp_node')]
#[ORM\HasLifecycleCallbacks]
class RdpNode
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 120)]
    private string $name = '';

    #[ORM\Column(name: 'endpoint_host', length: 255)]
    private string $endpointHost = 'guacd';

    #[ORM\Column(name: 'endpoint_port')]
    private int $endpointPort = 4822;

    #[ORM\Column(name: 'tls_mode', length: 16)]
    private string $tlsMode = 'none';

    #[ORM\Column(name: 'ca_fingerprint', length: 128, nullable: true)]
    private ?string $caFingerprint = null;

    #[ORM\Column(length: 16)]
    private string $status = 'unknown';

    #[ORM\Column]
    private bool $active = true;

    #[ORM\Column(name: 'is_local')]
    private bool $local = false;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

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

    public function getEndpointHost(): string
    {
        return $this->endpointHost;
    }

    public function setEndpointHost(string $endpointHost): self
    {
        $this->endpointHost = $endpointHost;

        return $this;
    }

    public function getEndpointPort(): int
    {
        return $this->endpointPort;
    }

    public function setEndpointPort(int $endpointPort): self
    {
        $this->endpointPort = $endpointPort;

        return $this;
    }

    public function getTlsMode(): string
    {
        return $this->tlsMode;
    }

    public function setTlsMode(string $tlsMode): self
    {
        $this->tlsMode = $tlsMode;

        return $this;
    }

    public function getCaFingerprint(): ?string
    {
        return $this->caFingerprint;
    }

    public function setCaFingerprint(?string $caFingerprint): self
    {
        $this->caFingerprint = $caFingerprint;

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

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;

        return $this;
    }

    public function isLocal(): bool
    {
        return $this->local;
    }

    public function setLocal(bool $local): self
    {
        $this->local = $local;

        return $this;
    }
}
