<?php

namespace Samba\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;
use Samba\Repository\SambaServerAccessRepository;

#[ORM\Entity(repositoryClass: SambaServerAccessRepository::class)]
#[ORM\Table(name: 'samba_server_access')]
#[ORM\UniqueConstraint(name: 'UNIQ_samba_server_access', columns: ['server_id', 'user_id'])]
class SambaServerAccess
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: SambaServer::class)]
    #[ORM\JoinColumn(name: 'server_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private SambaServer $server;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private User $user;

    #[ORM\Column]
    private int $rights = 0;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'granted_by', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $grantedBy = null;

    #[ORM\Column(name: 'granted_at', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $grantedAt;

    public function __construct(SambaServer $server, User $user, int $rights, ?User $grantedBy)
    {
        $this->server = $server;
        $this->user = $user;
        $this->rights = $rights;
        $this->grantedBy = $grantedBy;
        $this->grantedAt = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getServer(): SambaServer
    {
        return $this->server;
    }

    public function getUser(): User
    {
        return $this->user;
    }

    public function getRights(): int
    {
        return $this->rights;
    }

    public function setRights(int $rights): self
    {
        $this->rights = $rights;

        return $this;
    }

    public function getGrantedAt(): \DateTimeInterface
    {
        return $this->grantedAt;
    }
}
