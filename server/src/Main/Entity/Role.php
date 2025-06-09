<?php

namespace Main\Entity;

use Doctrine\DBAL\Types\Types;
use Main\Repository\RoleRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: RoleRepository::class)]
#[ORM\UniqueConstraint(columns: ["code", "claimant_id"])]
#[ORM\Table(name: 'main_role')]
class Role {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 191)]
    private ?string $code = null;

    #[ORM\ManyToOne(targetEntity: Claimant::class)]
    #[ORM\JoinColumn(name: "claimant_id", referencedColumnName: "id", onDelete: "CASCADE")]
    private ?Claimant $claimant = null;

    #[ORM\Column(name: "level", type: Types::INTEGER, options: ["default" => 0])]
    private ?int $level = 0;

    public function getId(): ?int {
        return $this->id;
    }

    public function getCode(): ?string {
        return $this->code;
    }

    public function setCode(string $code): self {
        $this->code = $code;

        return $this;
    }

    public function getClaimant(): ?Claimant {
        return $this->claimant;
    }

    public function setClaimant(?Claimant $claimant): self {
        $this->claimant = $claimant;

        return $this;
    }
    public function getLevel (): ?int {
        return $this->level;
    }

    public function setLevel (int $level): self {
        $this->level = $level;

        return $this;
    }

    public function __toString(): string {
        return sprintf("%s (%s)", $this->name, $this->code);
    }
}
