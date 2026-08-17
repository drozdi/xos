<?php

namespace Board\Entity;

use Board\Repository\ActivityLogRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: ActivityLogRepository::class)]
#[ORM\Table(name: 'board_activity_log')]
#[ORM\Index(name: 'IDX_board_activity_card', columns: ['card_id', 'created_at'])]
#[ORM\Index(name: 'IDX_board_activity_board', columns: ['board_id', 'created_at'])]
#[ORM\HasLifecycleCallbacks]
class ActivityLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class)]
    #[ORM\JoinColumn(name: 'board_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Board $board = null;

    #[ORM\ManyToOne(targetEntity: Card::class)]
    #[ORM\JoinColumn(name: 'card_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Card $card = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    #[ORM\Column(name: 'action_type', length: 32)]
    private string $actionType = '';

    /** @var array<string, mixed> */
    #[ORM\Column(type: Types::JSON)]
    private array $details = [];

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if (null === $this->createdAt) {
            $this->createdAt = new \DateTime();
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBoard(): ?Board
    {
        return $this->board;
    }

    public function setBoard(?Board $board): self
    {
        $this->board = $board;

        return $this;
    }

    public function getCard(): ?Card
    {
        return $this->card;
    }

    public function setCard(?Card $card): self
    {
        $this->card = $card;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getActionType(): string
    {
        return $this->actionType;
    }

    public function setActionType(string $actionType): self
    {
        $this->actionType = $actionType;

        return $this;
    }

    /** @return array<string, mixed> */
    public function getDetails(): array
    {
        return $this->details;
    }

    /** @param array<string, mixed> $details */
    public function setDetails(array $details): self
    {
        $this->details = $details;

        return $this;
    }

    public function getCreatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->createdAt) {
            return $this->createdAt->format($format);
        }

        return $this->createdAt;
    }
}
