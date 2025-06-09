<?php

namespace Main\Entity\User;

use Main\Entity\Claimant;
use Main\Entity\User as MainUser;
use Main\Repository\User\AccessRepository;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\DBAL\Types\Types;

#[ORM\Entity(repositoryClass: AccessRepository::class)]
#[ORM\Table(name: 'main_user_access')]
#[ORM\UniqueConstraint(columns: ["user_id", "claimant_id"])]
class Access
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: MainUser::class, inversedBy: 'accesses')]
    #[ORM\JoinColumn(name: "user_id", referencedColumnName: "id", onDelete: "CASCADE")]
    private ?MainUser $user = null;

    #[ORM\ManyToOne(targetEntity: Claimant::class)]
    #[ORM\JoinColumn(name: "claimant_id", referencedColumnName: "id", onDelete: "CASCADE")]
    private ?Claimant $claimant = null;

    #[ORM\Column(name: "level", type: Types::INTEGER, options: ["default" => 0])]
    private ?int $level = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?MainUser
    {
        return $this->user;
    }

    public function setUser(?MainUser $user): self
    {
        $this->user = $user;

        return $this;
    }

    public function getClaimant(): ?Claimant
    {
        return $this->claimant;
    }

    public function setClaimant(?Claimant $claimant): self
    {
        $this->claimant = $claimant;

        return $this;
    }

    public function getLevel (): ?int
    {
        return $this->level;
    }

    public function setLevel (int $level): self
    {
        $this->level = $level;

        return $this;
    }

    public function getName(bool$full = false): ?string {
        if (null === $this->claimant) {
            return null;
        }
        $name = $this->claimant->getName();
        if (true === $full) {
            $name .= " (".$this->claimant->getCode().")";
        }
        return $name;
    }
    public function getCode (): ?string {
        if (null === $this->claimant) {
            return null;
        }
        return $this->claimant->getCode();
    }
}
