<?php

namespace Ts\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Ts\Repository\UserTsCredentialRepository;

#[ORM\Entity(repositoryClass: UserTsCredentialRepository::class)]
#[ORM\Table(name: 'ts_user_credential')]
#[ORM\UniqueConstraint(name: 'uniq_ts_user_credential_user', columns: ['user_id'])]
#[ORM\HasLifecycleCallbacks]
class UserTsCredential
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(name: 'base_url', length: 512)]
    private string $baseUrl = '';

    #[ORM\Column(name: 'private_token', type: Types::TEXT)]
    private string $privateToken = '';

    #[ORM\Column(name: 'ts_username', length: 255, nullable: true)]
    private ?string $tsUsername = null;

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

    public function getUser(): User
    {
        return $this->user;
    }

    public function getBaseUrl(): string
    {
        return $this->baseUrl;
    }

    public function setBaseUrl(string $baseUrl): self
    {
        $this->baseUrl = $baseUrl;

        return $this;
    }

    public function getPrivateToken(): string
    {
        return $this->privateToken;
    }

    public function setPrivateToken(string $privateToken): self
    {
        $this->privateToken = $privateToken;

        return $this;
    }

    public function getTsUsername(): ?string
    {
        return $this->tsUsername;
    }

    public function setTsUsername(?string $tsUsername): self
    {
        $trimmed = null === $tsUsername ? '' : trim($tsUsername);
        $this->tsUsername = '' === $trimmed ? null : $trimmed;

        return $this;
    }

    public function getCreatedAt(): ?\DateTimeInterface
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeInterface
    {
        return $this->updatedAt;
    }
}
