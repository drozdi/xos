<?php

namespace Board\Entity;

use Board\Repository\WorkspaceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: WorkspaceRepository::class)]
#[ORM\Table(name: 'board_workspace')]
#[ORM\HasLifecycleCallbacks]
class Workspace
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private string $name = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private ?User $owner = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'updated_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $updatedAt = null;

    /** @var Collection<int, WorkspaceMember> */
    #[ORM\OneToMany(mappedBy: 'workspace', targetEntity: WorkspaceMember::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $members;

    /** @var Collection<int, Board> */
    #[ORM\OneToMany(mappedBy: 'workspace', targetEntity: Board::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $boards;

    public function __construct()
    {
        $this->members = new ArrayCollection();
        $this->boards = new ArrayCollection();
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

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

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

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): self
    {
        $this->owner = $owner;

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

    /** @return Collection<int, WorkspaceMember> */
    public function getMembers(): Collection
    {
        return $this->members;
    }

    public function addMember(WorkspaceMember $member): self
    {
        if (!$this->members->contains($member)) {
            $this->members->add($member);
            $member->setWorkspace($this);
        }

        return $this;
    }

    public function removeMember(WorkspaceMember $member): self
    {
        $this->members->removeElement($member);

        return $this;
    }

    /** @return Collection<int, Board> */
    public function getBoards(): Collection
    {
        return $this->boards;
    }

    public function addBoard(Board $board): self
    {
        if (!$this->boards->contains($board)) {
            $this->boards->add($board);
            $board->setWorkspace($this);
        }

        return $this;
    }
}
