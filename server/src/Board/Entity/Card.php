<?php

namespace Board\Entity;

use Board\Repository\CardRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: CardRepository::class)]
#[ORM\Table(name: 'board_card')]
#[ORM\HasLifecycleCallbacks]
class Card
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: BoardList::class, inversedBy: 'cards')]
    #[ORM\JoinColumn(name: 'list_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?BoardList $list = null;

    #[ORM\Column(length: 512)]
    private string $title = '';

    #[ORM\Column(name: 'description_md', type: Types::TEXT, nullable: true)]
    private ?string $descriptionMd = null;

    #[ORM\Column(name: 'due_date', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dueDate = null;

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 1024;

    #[ORM\Column(name: 'cover_color', length: 16, nullable: true)]
    private ?string $coverColor = null;

    #[ORM\Column(name: 'archived_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $archivedAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    /** @var Collection<int, Label> */
    #[ORM\ManyToMany(targetEntity: Label::class, inversedBy: 'cards')]
    #[ORM\JoinTable(name: 'board_card_label')]
    #[ORM\JoinColumn(name: 'card_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'label_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Collection $labels;

    /** @var Collection<int, User> */
    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'board_card_assignee')]
    #[ORM\JoinColumn(name: 'card_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'user_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Collection $assignees;

    /** @var Collection<int, Checklist> */
    #[ORM\OneToMany(mappedBy: 'card', targetEntity: Checklist::class)]
    private Collection $checklists;

    /** @var Collection<int, Comment> */
    #[ORM\OneToMany(mappedBy: 'card', targetEntity: Comment::class)]
    private Collection $comments;

    /** @var Collection<int, Attachment> */
    #[ORM\OneToMany(mappedBy: 'card', targetEntity: Attachment::class)]
    private Collection $attachments;

    public function __construct()
    {
        $this->labels = new ArrayCollection();
        $this->assignees = new ArrayCollection();
        $this->checklists = new ArrayCollection();
        $this->comments = new ArrayCollection();
        $this->attachments = new ArrayCollection();
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

    public function getList(): ?BoardList
    {
        return $this->list;
    }

    public function setList(?BoardList $list): self
    {
        $this->list = $list;

        return $this;
    }

    public function getBoard(): ?Board
    {
        return $this->list?->getBoard();
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

    public function getDescriptionMd(): ?string
    {
        return $this->descriptionMd;
    }

    public function setDescriptionMd(?string $descriptionMd): self
    {
        $this->descriptionMd = $descriptionMd;

        return $this;
    }

    public function getDueDate(): ?\DateTimeInterface
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeInterface $dueDate): self
    {
        $this->dueDate = $dueDate;

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

    public function getCoverColor(): ?string
    {
        return $this->coverColor;
    }

    public function setCoverColor(?string $coverColor): self
    {
        $this->coverColor = $coverColor;

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

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): self
    {
        $this->createdBy = $createdBy;

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

    /** @return Collection<int, Label> */
    public function getLabels(): Collection
    {
        return $this->labels;
    }

    public function addLabel(Label $label): self
    {
        if (!$this->labels->contains($label)) {
            $this->labels->add($label);
        }

        return $this;
    }

    public function removeLabel(Label $label): self
    {
        $this->labels->removeElement($label);

        return $this;
    }

    /** @return Collection<int, User> */
    public function getAssignees(): Collection
    {
        return $this->assignees;
    }

    public function addAssignee(User $user): self
    {
        if (!$this->assignees->contains($user)) {
            $this->assignees->add($user);
        }

        return $this;
    }

    public function removeAssignee(User $user): self
    {
        $this->assignees->removeElement($user);

        return $this;
    }

    /** @return Collection<int, Checklist> */
    public function getChecklists(): Collection
    {
        return $this->checklists;
    }

    /** @return Collection<int, Comment> */
    public function getComments(): Collection
    {
        return $this->comments;
    }

    /** @return Collection<int, Attachment> */
    public function getAttachments(): Collection
    {
        return $this->attachments;
    }
}
