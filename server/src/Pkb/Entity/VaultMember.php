<?php

namespace Pkb\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Pkb\Enum\VaultMemberRole;
use Pkb\Repository\VaultMemberRepository;

#[ORM\Entity(repositoryClass: VaultMemberRepository::class)]
#[ORM\Table(name: 'pkb_vault_member')]
#[ORM\UniqueConstraint(name: 'UNIQ_pkb_vault_member_vault_user', columns: ['vault_id', 'user_id'])]
#[ORM\HasLifecycleCallbacks]
class VaultMember
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Vault::class, inversedBy: 'members')]
    #[ORM\JoinColumn(name: 'vault_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Vault $vault = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(type: Types::STRING, length: 16, enumType: VaultMemberRole::class)]
    private VaultMemberRole $role = VaultMemberRole::Reader;

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

    public function getVault(): ?Vault
    {
        return $this->vault;
    }

    public function setVault(?Vault $vault): self
    {
        $this->vault = $vault;

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

    public function getRole(): VaultMemberRole
    {
        return $this->role;
    }

    public function setRole(VaultMemberRole $role): self
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
