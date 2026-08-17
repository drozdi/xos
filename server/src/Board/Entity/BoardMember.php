<?php

namespace Board\Entity;

use Board\Enum\MemberRole;
use Board\Repository\BoardMemberRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: BoardMemberRepository::class)]
#[ORM\Table(name: 'board_board_member')]
#[ORM\UniqueConstraint(name: 'uniq_bbm_board_user', columns: ['board_id', 'user_id'])]
#[ORM\HasLifecycleCallbacks]
class BoardMember
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class, inversedBy: 'members')]
    #[ORM\JoinColumn(name: 'board_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Board $board = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: Types::STRING, length: 16, enumType: MemberRole::class)]
    private MemberRole $role = MemberRole::Editor;

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

    public function getCreatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->createdAt) {
            return $this->createdAt->format($format);
        }

        return $this->createdAt;
    }
}
