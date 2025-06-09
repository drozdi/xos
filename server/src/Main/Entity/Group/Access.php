<?php

namespace Main\Entity\Group;

use Main\Entity\Claimant;
use Main\Entity\Group as MainGroup;
use Main\Repository\Group\AccessRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AccessRepository::class)]
#[ORM\Table(name: 'main_group_access')]
#[ORM\UniqueConstraint(columns: ["group_id", "claimant_id"])]
class Access
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: MainGroup::class, inversedBy: 'accesses')]
    #[ORM\JoinColumn(name: "group_id", referencedColumnName: "id", onDelete: "CASCADE")]
    private ?MainGroup $group = null;

    #[ORM\ManyToOne(targetEntity: Claimant::class)]
    #[ORM\JoinColumn(name: "claimant_id", referencedColumnName: "id", onDelete: "CASCADE")]
    private ?Claimant $claimant = null;

    #[ORM\Column(name: "`level`", type: Types::INTEGER, options: ["default" => 0])]
    private ?int $level = 0;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getGroup(): ?MainGroup
    {
        return $this->group;
    }

    public function setGroup(?MainGroup $group): self
    {
        $this->group = $group;

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
}
