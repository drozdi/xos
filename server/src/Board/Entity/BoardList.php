<?php

namespace Board\Entity;

use Board\Repository\BoardListRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: BoardListRepository::class)]
#[ORM\Table(name: 'board_list')]
#[ORM\HasLifecycleCallbacks]
class BoardList
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class, inversedBy: 'lists')]
    #[ORM\JoinColumn(name: 'board_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Board $board = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\Column(name: 'order_index', type: Types::INTEGER)]
    private int $orderIndex = 1024;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'assignee_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $assignee = null;

    #[ORM\Column(name: 'archived_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $archivedAt = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    /** @var Collection<int, Card> */
    #[ORM\OneToMany(mappedBy: 'list', targetEntity: Card::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC', 'id' => 'ASC'])]
    private Collection $cards;

    public function __construct()
    {
        $this->cards = new ArrayCollection();
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

    public function getBoard(): ?Board
    {
        return $this->board;
    }

    public function setBoard(?Board $board): self
    {
        $this->board = $board;

        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getOrderIndex(): int
    {
        return $this->orderIndex;
    }

    public function setOrderIndex(int $orderIndex): self
    {
        $this->orderIndex = $orderIndex;

        return $this;
    }

    public function getAssignee(): ?User
    {
        return $this->assignee;
    }

    public function setAssignee(?User $assignee): self
    {
        $this->assignee = $assignee;

        return $this;
    }

    public function getArchivedAt(): ?\DateTimeInterface
    {
        return $this->archivedAt;
    }

    public function setArchivedAt(?\DateTimeInterface $archivedAt): self
    {
        $this->archivedAt = $archivedAt;

        return $this;
    }

    public function getCreatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->createdAt) {
            return $this->createdAt->format($format);
        }

        return $this->createdAt;
    }

    public function getUpdatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->updatedAt) {
            return $this->updatedAt->format($format);
        }

        return $this->updatedAt;
    }

    /** @return Collection<int, Card> */
    public function getCards(): Collection
    {
        return $this->cards;
    }

    public function addCard(Card $card): self
    {
        if (!$this->cards->contains($card)) {
            $this->cards->add($card);
            $card->setList($this);
        }

        return $this;
    }

    public function removeCard(Card $card): self
    {
        $this->cards->removeElement($card);

        return $this;
    }
}
