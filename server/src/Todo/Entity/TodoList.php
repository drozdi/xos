<?php

namespace Todo\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Todo\Repository\TodoListRepository;

#[ORM\Entity(repositoryClass: TodoListRepository::class)]
#[ORM\Table(name: 'todo_list')]
#[ORM\HasLifecycleCallbacks]
class TodoList
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\Column(length: 32, options: ['default' => '#fff59d'])]
    private string $color = '#fff59d';

    /** Свободные заметки в Markdown (ниже чеклиста). */
    #[ORM\Column(name: 'notes_md', type: Types::TEXT, nullable: true)]
    private ?string $notesMd = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    /** @var Collection<int, TodoItem> */
    #[ORM\OneToMany(mappedBy: 'list', targetEntity: TodoItem::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC', 'id' => 'ASC'])]
    private Collection $items;

    /** @var Collection<int, TodoListShare> */
    #[ORM\OneToMany(mappedBy: 'list', targetEntity: TodoListShare::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $shares;

    public function __construct()
    {
        $this->items = new ArrayCollection();
        $this->shares = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTime();
        if (null === $this->createdAt) {
            $this->createdAt = $now;
        }
        $this->xTimestamp = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->xTimestamp = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getXTimestamp(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }

        return $this->xTimestamp;
    }

    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self
    {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): self
    {
        $this->owner = $owner;

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

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): self
    {
        $this->color = $color;

        return $this;
    }

    public function getNotesMd(): ?string
    {
        return $this->notesMd;
    }

    public function setNotesMd(?string $notesMd): self
    {
        $this->notesMd = $notesMd;

        return $this;
    }

    public function getCreatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->createdAt) {
            return $this->createdAt->format($format);
        }

        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeInterface $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    /** @return Collection<int, TodoItem> */
    public function getItems(): Collection
    {
        return $this->items;
    }

    public function addItem(TodoItem $item): self
    {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setList($this);
        }

        return $this;
    }

    public function removeItem(TodoItem $item): self
    {
        $this->items->removeElement($item);

        return $this;
    }

    /** @return Collection<int, TodoListShare> */
    public function getShares(): Collection
    {
        return $this->shares;
    }

    public function addShare(TodoListShare $share): self
    {
        if (!$this->shares->contains($share)) {
            $this->shares->add($share);
            $share->setList($this);
        }

        return $this;
    }

    public function removeShare(TodoListShare $share): self
    {
        $this->shares->removeElement($share);

        return $this;
    }
}
