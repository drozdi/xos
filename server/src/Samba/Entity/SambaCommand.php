<?php

namespace Samba\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Samba\Repository\SambaCommandRepository;

#[ORM\Entity(repositoryClass: SambaCommandRepository::class)]
#[ORM\Table(name: 'samba_command')]
#[ORM\Index(name: 'IDX_samba_command_queue', columns: ['server_id', 'status'])]
class SambaCommand
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: SambaServer::class)]
    #[ORM\JoinColumn(name: 'server_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private SambaServer $server;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $author;

    #[ORM\Column(name: 'author_label', length: 255)]
    private string $authorLabel;

    #[ORM\Column(length: 32)]
    private string $type;

    /** @var array<string, mixed> */
    #[ORM\Column(type: Types::JSON)]
    private array $args;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $sealed = null;

    #[ORM\Column(length: 16)]
    private string $status = 'queued';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $result = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(name: 'finished_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $finishedAt = null;

    /**
     * @param array<string, mixed> $args
     */
    public function __construct(SambaServer $server, ?User $author, string $authorLabel, string $type, array $args, ?string $sealed)
    {
        $this->server = $server;
        $this->author = $author;
        $this->authorLabel = $authorLabel;
        $this->type = $type;
        $this->args = $args;
        $this->sealed = $sealed;
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getServer(): SambaServer
    {
        return $this->server;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function getType(): string
    {
        return $this->type;
    }

    /**
     * @return array<string, mixed>
     */
    public function getArgs(): array
    {
        return $this->args;
    }

    public function getSealed(): ?string
    {
        return $this->sealed;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function getResult(): ?string
    {
        return $this->result;
    }

    public function getCreatedAt(): \DateTimeInterface
    {
        return $this->createdAt;
    }

    public function markDelivered(): void
    {
        $this->status = 'delivered';
    }

    public function finish(string $status, string $result): void
    {
        $this->status = $status;
        $this->result = $result;
        $this->sealed = null;
        $this->finishedAt = new \DateTime();
    }
}
