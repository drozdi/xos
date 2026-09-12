<?php

namespace IncCom\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use IncCom\Repository\UserFnsCredentialRepository;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: UserFnsCredentialRepository::class)]
#[ORM\Table(name: 'inccom_user_fns_credential')]
#[ORM\UniqueConstraint(name: 'uniq_inccom_user_fns_credential_user', columns: ['user_id'])]
#[ORM\HasLifecycleCallbacks]
class UserFnsCredential
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column(name: 'server', length: 512)]
    private string $server = '';

    #[ORM\Column(name: 'username', length: 255)]
    private string $username = '';

    #[ORM\Column(name: 'master_token', type: Types::TEXT)]
    private string $masterToken = '';

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

    public function getServer(): string
    {
        return $this->server;
    }

    public function setServer(string $server): self
    {
        $this->server = $server;

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

    public function getMasterToken(): string
    {
        return $this->masterToken;
    }

    public function setMasterToken(string $masterToken): self
    {
        $this->masterToken = $masterToken;

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
