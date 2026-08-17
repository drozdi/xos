<?php

namespace Board\Entity;

use Board\Repository\BoardRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: BoardRepository::class)]
#[ORM\Table(name: 'board_board')]
#[ORM\HasLifecycleCallbacks]
class Board
{
    public const VISIBILITY_PRIVATE = 'private';
    public const VISIBILITY_WORKSPACE = 'workspace';

    public const BACKGROUND_COLOR = 'color';
    public const BACKGROUND_IMAGE = 'image';
    public const BACKGROUND_GRADIENT = 'gradient';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Workspace::class, inversedBy: 'boards')]
    #[ORM\JoinColumn(name: 'workspace_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Workspace $workspace = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'background_type', length: 16, options: ['default' => self::BACKGROUND_COLOR])]
    private string $backgroundType = self::BACKGROUND_COLOR;

    #[ORM\Column(name: 'background_value', length: 512, options: ['default' => '#0079bf'])]
    private string $backgroundValue = '#0079bf';

    #[ORM\Column(length: 16, options: ['default' => self::VISIBILITY_PRIVATE])]
    private string $visibility = self::VISIBILITY_PRIVATE;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    /** @var Collection<int, BoardMember> */
    #[ORM\OneToMany(mappedBy: 'board', targetEntity: BoardMember::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $members;

    /** @var Collection<int, BoardList> */
    #[ORM\OneToMany(mappedBy: 'board', targetEntity: BoardList::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['orderIndex' => 'ASC', 'id' => 'ASC'])]
    private Collection $lists;

    /** @var Collection<int, Label> */
    #[ORM\OneToMany(mappedBy: 'board', targetEntity: Label::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['name' => 'ASC', 'id' => 'ASC'])]
    private Collection $labels;

    public function __construct()
    {
        $this->members = new ArrayCollection();
        $this->lists = new ArrayCollection();
        $this->labels = new ArrayCollection();
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

    public function getWorkspace(): ?Workspace
    {
        return $this->workspace;
    }

    public function setWorkspace(?Workspace $workspace): self
    {
        $this->workspace = $workspace;

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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getBackgroundType(): string
    {
        return $this->backgroundType;
    }

    public function setBackgroundType(string $backgroundType): self
    {
        $this->backgroundType = $backgroundType;

        return $this;
    }

    public function getBackgroundValue(): string
    {
        return $this->backgroundValue;
    }

    public function setBackgroundValue(string $backgroundValue): self
    {
        $this->backgroundValue = $backgroundValue;

        return $this;
    }

    public function getVisibility(): string
    {
        return $this->visibility;
    }

    public function setVisibility(string $visibility): self
    {
        $this->visibility = $visibility;

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

    /** @return Collection<int, BoardMember> */
    public function getMembers(): Collection
    {
        return $this->members;
    }

    public function addMember(BoardMember $member): self
    {
        if (!$this->members->contains($member)) {
            $this->members->add($member);
            $member->setBoard($this);
        }

        return $this;
    }

    public function removeMember(BoardMember $member): self
    {
        $this->members->removeElement($member);

        return $this;
    }

    /** @return Collection<int, BoardList> */
    public function getLists(): Collection
    {
        return $this->lists;
    }

    public function addList(BoardList $list): self
    {
        if (!$this->lists->contains($list)) {
            $this->lists->add($list);
            $list->setBoard($this);
        }

        return $this;
    }

    public function removeList(BoardList $list): self
    {
        $this->lists->removeElement($list);

        return $this;
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
            $label->setBoard($this);
        }

        return $this;
    }

    public function removeLabel(Label $label): self
    {
        $this->labels->removeElement($label);

        return $this;
    }
}
