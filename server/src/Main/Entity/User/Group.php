<?php

namespace Main\Entity\User;

use Main\Entity\Group as MainGroup;
use Main\Entity\User as MainUser;
use Main\Repository\User\GroupRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: GroupRepository::class)]
#[ORM\Table(name: 'main_user_group')]
#[ORM\UniqueConstraint(columns: ["user_id", "group_id"])]
class Group
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: MainUser::class, inversedBy: 'groups')]
    #[ORM\JoinColumn(name: "user_id", referencedColumnName: "id", nullable: false, onDelete: "CASCADE")]
    private ?MainUser $user = null;

    #[ORM\ManyToOne(targetEntity: MainGroup::class, inversedBy: 'users')]
    #[ORM\JoinColumn(name: "group_id", referencedColumnName: "id", nullable: false, onDelete: "CASCADE")]
    private ?MainGroup $group = null;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    public function getId(): ?int {
        return $this->id;
    }

    public function getUser(): ?MainUser {
        return $this->user;
    }

    public function getUserId (): ?int {
        return $this->user->getId();
    }

    public function getUserAlias (): ?string {
        return $this->user->getAlias();
    }

    public function getUserLogin (): ?string {
        return $this->user->getLogin();
    }

    public function setUser (?MainUser $user = null, $addGroup = true): self {
        if (true === $addGroup && null == $user) {
            $this->user->removeGroup($this, false);
        }

        $this->user = $user;

        if (true === $addGroup && null != $this->user) {
            $this->user->addGroup($this, false);
        }

        return $this;
    }

    public function getGroup(): ?MainGroup {
        return $this->group;
    }

    public function getGroupId (): ?int  {
        return $this->group->getId();
    }

    public function getGroupName (): ?string  {
        return $this->group->getName();
    }

    public function getGroupCode (): ?string  {
        return $this->group->getCode();
    }

    public function setGroup (?MainGroup $group = null, bool$addUser = true): self {
        if (true === $addUser && null == $group) {
            $this->group->removeUser($this, false);
        }

        $this->group = $group;

        if (true === $addUser && null != $this->group) {
            $this->group->addUser($this, false);
        }

        return $this;
    }

    public function getActiveFrom(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeFrom->format($format);
        }
        return $this->activeFrom;
    }

    public function setActiveFrom(?\DateTimeInterface $activeFrom): self {
        $this->activeFrom = $activeFrom;

        return $this;
    }

    public function getActiveTo(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeTo) {
            return $this->activeTo->format($format);
        }
        return $this->activeTo;
    }

    public function setActiveTo(?\DateTimeInterface $activeTo): self {
        $this->activeTo = $activeTo;

        return $this;
    }


    public function isGroup (?MainGroup $group = null): bool {
        if (null === $group) {
            return false;
        }
        return $this->group->getId() === $group->getId();
    }

    public function isUser (?MainUser $user = null): bool {
        if (null === $user) {
            return false;
        }
        return $this->user->getId() === $user->getId();
    }
}
