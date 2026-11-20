<?php

namespace Samba\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Samba\Repository\SambaAgentCredentialRepository;

#[ORM\Entity(repositoryClass: SambaAgentCredentialRepository::class)]
#[ORM\Table(name: 'samba_agent_credential')]
#[ORM\Index(name: 'IDX_samba_agent_lookup', columns: ['lookup'])]
class SambaAgentCredential
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: SambaServer::class)]
    #[ORM\JoinColumn(name: 'server_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private SambaServer $server;

    #[ORM\Column(length: 16)]
    private string $kind = 'secret';

    #[ORM\Column(length: 16)]
    private string $lookup = '';

    #[ORM\Column(name: 'secret_hash', length: 255)]
    private string $secretHash = '';

    #[ORM\Column(name: 'seal_public_key', type: Types::TEXT, nullable: true)]
    private ?string $sealPublicKey = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $bearer = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(name: 'revoked_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $revokedAt = null;

    public function __construct(SambaServer $server, string $lookup, string $secretHash, ?string $sealPublicKey)
    {
        $this->server = $server;
        $this->lookup = $lookup;
        $this->secretHash = $secretHash;
        $this->sealPublicKey = $sealPublicKey;
        $this->createdAt = new \DateTime();
    }

    public function getServer(): SambaServer
    {
        return $this->server;
    }

    public function getSecretHash(): string
    {
        return $this->secretHash;
    }

    public function getSealPublicKey(): ?string
    {
        return $this->sealPublicKey;
    }

    public function setBearer(string $bearer): void
    {
        $this->bearer = $bearer;
    }

    public function getBearer(): ?string
    {
        return $this->bearer;
    }

    public function getRevokedAt(): ?\DateTimeInterface
    {
        return $this->revokedAt;
    }
}
