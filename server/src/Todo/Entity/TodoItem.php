<?php

namespace Todo\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Todo\Repository\TodoItemRepository;

#[ORM\Entity(repositoryClass: TodoItemRepository::class)]
#[ORM\Table(name: 'todo_item')]
#[ORM\Index(name: 'IDX_TODO_ITEM_DUE', columns: ['due_at'])]
#[ORM\HasLifecycleCallbacks]
class TodoItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: TodoList::class, inversedBy: 'items')]
    #[ORM\JoinColumn(name: 'list_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?TodoList $list = null;

    #[ORM\Column(type: Types::TEXT)]
    private string $text = '';

    #[ORM\Column(type: Types::BOOLEAN, options: ['default' => false])]
    private bool $done = false;

    #[ORM\Column(name: 'due_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dueAt = null;

    #[ORM\Column(type: Types::INTEGER, options: ['default' => 0])]
    private int $position = 0;

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

    public function getList(): ?TodoList
    {
        return $this->list;
    }

    public function setList(?TodoList $list): self
    {
        $this->list = $list;

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

    public function isDone(): bool
    {
        return $this->done;
    }

    public function setDone(bool $done): self
    {
        $this->done = $done;

        return $this;
    }

    public function getDueAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->dueAt) {
            return $this->dueAt->format($format);
        }

        return $this->dueAt;
    }

    public function setDueAt(?\DateTimeInterface $dueAt): self
    {
        $this->dueAt = $dueAt;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;

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
