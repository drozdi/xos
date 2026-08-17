<?php

namespace Board\Entity;

use Board\Enum\MemberRole;
use Board\Repository\WorkspaceMemberRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: WorkspaceMemberRepository::class)]
#[ORM\Table(name: 'board_workspace_member')]
#[ORM\UniqueConstraint(name: 'uniq_bwm_workspace_user', columns: ['workspace_id', 'user_id'])]
#[ORM\HasLifecycleCallbacks]
class WorkspaceMember
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Workspace::class, inversedBy: 'members')]
    #[ORM\JoinColumn(name: 'workspace_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Workspace $workspace = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: Types::STRING, length: 16, enumType: MemberRole::class)]
    private MemberRole $role = MemberRole::Editor;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'invited_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $invitedBy = null;

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

    public function getWorkspace(): ?Workspace
    {
        return $this->workspace;
    }

    public function setWorkspace(?Workspace $workspace): self
    {
        $this->workspace = $workspace;

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

    public function getRole(): MemberRole
    {
        return $this->role;
    }

    public function setRole(MemberRole $role): self
    {
        $this->role = $role;

        return $this;
    }

    public function getInvitedBy(): ?User
    {
        return $this->invitedBy;
    }

    public function setInvitedBy(?User $invitedBy): self
    {
        $this->invitedBy = $invitedBy;

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
