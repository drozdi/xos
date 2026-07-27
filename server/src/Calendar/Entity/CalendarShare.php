<?php

namespace Calendar\Entity;

use Calendar\Repository\CalendarShareRepository;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: CalendarShareRepository::class)]
#[ORM\Table(name: 'calendar_share')]
#[ORM\UniqueConstraint(name: 'UNIQ_CALENDAR_SHARE', columns: ['calendar_id', 'user_id'])]
class CalendarShare
{
    public const PERMISSION_READ = 'read';
    public const PERMISSION_WRITE = 'write';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Calendar::class, inversedBy: 'shares')]
    #[ORM\JoinColumn(name: 'calendar_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Calendar $calendar = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    #[ORM\Column(length: 16, options: ['default' => self::PERMISSION_READ])]
    private string $permission = self::PERMISSION_READ;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCalendar(): ?Calendar
    {
        return $this->calendar;
    }

    public function setCalendar(?Calendar $calendar): self
    {
        $this->calendar = $calendar;

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

    public function getPermission(): string
    {
        return $this->permission;
    }

    public function setPermission(string $permission): self
    {
        $this->permission = $permission;

        return $this;
    }

    public function canWrite(): bool
    {
        return self::PERMISSION_WRITE === $this->permission;
    }
}
