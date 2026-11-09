<?php

namespace Ops\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Ops\Repository\OpsLinkRepository;
use Ssh\Entity\SshConnection;

#[ORM\Entity(repositoryClass: OpsLinkRepository::class)]
#[ORM\Table(name: 'ops_link')]
#[ORM\Index(name: 'IDX_ops_link_user_kind', columns: ['user_id', 'kind'])]
#[ORM\HasLifecycleCallbacks]
class OpsLink
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\ManyToOne(targetEntity: SshConnection::class)]
    #[ORM\JoinColumn(name: 'ssh_connection_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?SshConnection $sshConnection = null;

    #[ORM\Column(length: 16)]
    private string $kind = '';

    #[ORM\Column(length: 120)]
    private string $name = '';

    #[ORM\Column(length: 255)]
    private string $host = '';

    #[ORM\Column]
    private int $port = 0;

    #[ORM\Column(length: 128)]
    private string $username = '';

    #[ORM\Column(type: Types::TEXT)]
    private string $secret = '';

    #[ORM\Column(length: 16)]
    private string $driver = '';

    #[ORM\Column(name: 'database_name', length: 128)]
    private string $databaseName = '';

    #[ORM\Column(name: 'listen_port')]
    private int $listenPort = 0;

    #[ORM\Column(name: 'target_host', length: 255)]
    private string $targetHost = '';

    #[ORM\Column(name: 'target_port')]
    private int $targetPort = 0;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    public function __construct(User $user, string $kind)
    {
        $this->user = $user;
        $this->kind = $kind;
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

    public function getSshConnection(): ?SshConnection
    {
        return $this->sshConnection;
    }

    public function setSshConnection(?SshConnection $sshConnection): self
    {
        $this->sshConnection = $sshConnection;

        return $this;
    }

    public function getKind(): string
    {
        return $this->kind;
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

    public function getSecret(): string
    {
        return $this->secret;
    }

    public function setSecret(string $secret): self
    {
        $this->secret = $secret;

        return $this;
    }

    public function getDriver(): string
    {
        return $this->driver;
    }

    public function setDriver(string $driver): self
    {
        $this->driver = $driver;

        return $this;
    }

    public function getDatabaseName(): string
    {
        return $this->databaseName;
    }

    public function setDatabaseName(string $databaseName): self
    {
        $this->databaseName = $databaseName;

        return $this;
    }

    public function getListenPort(): int
    {
        return $this->listenPort;
    }

    public function setListenPort(int $listenPort): self
    {
        $this->listenPort = $listenPort;

        return $this;
    }

    public function getTargetHost(): string
    {
        return $this->targetHost;
    }

    public function setTargetHost(string $targetHost): self
    {
        $this->targetHost = $targetHost;

        return $this;
    }

    public function getTargetPort(): int
    {
        return $this->targetPort;
    }

    public function setTargetPort(int $targetPort): self
    {
        $this->targetPort = $targetPort;

        return $this;
    }
}
