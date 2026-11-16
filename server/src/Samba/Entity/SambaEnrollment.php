<?php

namespace Samba\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Samba\Repository\SambaEnrollmentRepository;

#[ORM\Entity(repositoryClass: SambaEnrollmentRepository::class)]
#[ORM\Table(name: 'samba_enrollment')]
class SambaEnrollment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: SambaServer::class)]
    #[ORM\JoinColumn(name: 'server_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private SambaServer $server;

    #[ORM\Column(name: 'lookup', length: 16)]
    private string $lookup = '';

    #[ORM\Column(name: 'token_hash', length: 255)]
    private string $tokenHash = '';

    #[ORM\Column(name: 'expires_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $expiresAt;

    #[ORM\Column(name: 'used_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $usedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    public function __construct(SambaServer $server, string $tokenHash, \DateTimeInterface $expiresAt, ?User $createdBy)
    {
        $this->server = $server;
        $this->tokenHash = $tokenHash;
        $this->expiresAt = $expiresAt;
        $this->createdBy = $createdBy;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getServer(): SambaServer
    {
        return $this->server;
    }

    public function getTokenHash(): string
    {
        return $this->tokenHash;
    }

    public function getLookup(): string
    {
        return $this->lookup;
    }

    public function setLookup(string $lookup): self
    {
        $this->lookup = $lookup;

        return $this;
    }

    public function getExpiresAt(): \DateTimeInterface
    {
        return $this->expiresAt;
    }

    public function getUsedAt(): ?\DateTimeInterface
    {
        return $this->usedAt;
    }

    public function markUsed(): void
    {
        $this->usedAt = new \DateTime();
    }
}
