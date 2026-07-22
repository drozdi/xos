<?php

namespace SchoolTask\Entity;

use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use SchoolTask\Repository\EpGroupUserRepository;

#[ORM\Entity(repositoryClass: EpGroupUserRepository::class)]
#[ORM\Table(name: 'st_ep_group_user')]
#[ORM\UniqueConstraint(columns: ['group_id', 'user_id'])]
class EpGroupUser
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: EpGroup::class, inversedBy: 'users')]
    #[ORM\JoinColumn(name: 'group_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?EpGroup $group = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGroup(): ?EpGroup
    {
        return $this->group;
    }

    public function getGroupId(): ?int
    {
        return $this->group?->getId();
    }

    public function getGroupName(): ?string
    {
        return $this->group?->getName();
    }

    public function setGroup(?EpGroup $group): self
    {
        $this->group = $group;

        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function getUserId(): ?int
    {
        return $this->user?->getId();
    }

    public function getUserAlias(): ?string
    {
        return $this->user?->getAlias();
    }

    public function getUserLogin(): ?string
    {
        return $this->user?->getLogin();
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function isUser(User $user): bool
    {
        return (int) $this->user?->getId() === (int) $user->getId();
    }
}
