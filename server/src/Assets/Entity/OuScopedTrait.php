<?php

namespace Assets\Entity;

use Doctrine\ORM\Mapping as ORM;
use Main\Entity\OU;

/**
 * Nullable OU tenancy (same pattern as Main\Entity\User.ou).
 */
trait OuScopedTrait
{
    #[ORM\ManyToOne(targetEntity: OU::class)]
    #[ORM\JoinColumn(name: 'ou_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?OU $ou = null;

    public function getOu(): ?OU
    {
        return $this->ou;
    }

    public function setOu(?OU $ou): self
    {
        $this->ou = $ou;

        return $this;
    }
}
