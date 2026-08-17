<?php

namespace Board\Entity;

use Board\Repository\CommentRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: CommentRepository::class)]
#[ORM\Table(name: 'board_comment')]
#[ORM\Index(name: 'IDX_board_comment_card_created', columns: ['card_id', 'created_at'])]
#[ORM\HasLifecycleCallbacks]
class Comment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Card::class, inversedBy: 'comments')]
    #[ORM\JoinColumn(name: 'card_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Card $card = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: Types::TEXT)]
    private string $text = '';

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $updatedAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTime();
        if (null === $this->createdAt) {
            $this->createdAt = $now;
        }
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

    public function getText(): string
    {
        return $this->text;
    }

    public function setText(string $text): self
    {
        $this->text = $text;

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
}
