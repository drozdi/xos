<?php

namespace Rdp\Entity;

use Doctrine\ORM\Mapping as ORM;
use Main\Entity\Group;
use Rdp\Repository\RdpNetworkGrantRepository;

#[ORM\Entity(repositoryClass: RdpNetworkGrantRepository::class)]
#[ORM\Table(name: 'rdp_network_grant')]
#[ORM\UniqueConstraint(name: 'UNIQ_rdp_network_grant', columns: ['network_id', 'group_id', 'role'])]
class RdpNetworkGrant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: RdpNetwork::class, inversedBy: 'grants')]
    #[ORM\JoinColumn(name: 'network_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private RdpNetwork $network;

    #[ORM\ManyToOne(targetEntity: Group::class)]
    #[ORM\JoinColumn(name: 'group_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Group $group = null;

    #[ORM\Column(length: 64, nullable: true)]
    private ?string $role = null;

    public function __construct(RdpNetwork $network)
    {
        $this->network = $network;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNetwork(): RdpNetwork
    {
        return $this->network;
    }

    public function getGroup(): ?Group
    {
        return $this->group;
    }

    public function setGroup(?Group $group): self
    {
        $this->group = $group;

        return $this;
    }

    public function getRole(): ?string
    {
        return $this->role;
    }

    public function setRole(?string $role): self
    {
        $this->role = $role;

        return $this;
    }
}
