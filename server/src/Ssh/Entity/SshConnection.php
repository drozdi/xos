<?php

namespace Ssh\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Ssh\Repository\SshConnectionRepository;

#[ORM\Entity(repositoryClass: SshConnectionRepository::class)]
#[ORM\Table(name: 'ssh_connection')]
#[ORM\Index(name: 'IDX_ssh_connection_user', columns: ['user_id'])]
#[ORM\HasLifecycleCallbacks]
class SshConnection
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
    private int $port = 22;

    #[ORM\Column(length: 128)]
    private string $username = '';

    #[ORM\Column(length: 16)]
    private string $auth = 'password';

    #[ORM\Column(type: Types::TEXT)]
    private string $secret = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $passphrase = null;

    #[ORM\ManyToOne(targetEntity: SshKey::class)]
    #[ORM\JoinColumn(name: 'key_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?SshKey $key = null;

    #[ORM\Column(name: 'host_key_fingerprint', length: 128, nullable: true)]
    private ?string $hostKeyFingerprint = null;

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

    public function getUsername(): string
    {
        return $this->username;
    }

    public function setUsername(string $username): self
    {
        $this->username = $username;

        return $this;
    }

    public function getAuth(): string
    {
        return $this->auth;
    }

    public function setAuth(string $auth): self
    {
        $this->auth = $auth;

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

    public function getPassphrase(): ?string
    {
        return $this->passphrase;
    }

    public function setPassphrase(?string $passphrase): self
    {
        $this->passphrase = $passphrase;

        return $this;
    }

    public function getKey(): ?SshKey
    {
        return $this->key;
    }

    public function setKey(?SshKey $key): self
    {
        $this->key = $key;

        return $this;
    }

    public function getHostKeyFingerprint(): ?string
    {
        return $this->hostKeyFingerprint;
    }

    public function setHostKeyFingerprint(?string $hostKeyFingerprint): self
    {
        $this->hostKeyFingerprint = $hostKeyFingerprint;

        return $this;
    }
}
