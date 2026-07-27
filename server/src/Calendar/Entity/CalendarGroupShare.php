<?php

namespace Calendar\Entity;

use Calendar\Repository\CalendarGroupShareRepository;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\Group as MainGroup;

#[ORM\Entity(repositoryClass: CalendarGroupShareRepository::class)]
#[ORM\Table(name: 'calendar_group_share')]
#[ORM\UniqueConstraint(name: 'UNIQ_CALENDAR_GROUP_SHARE', columns: ['calendar_id', 'group_id'])]
class CalendarGroupShare
{
    public const PERMISSION_READ = 'read';
    public const PERMISSION_WRITE = 'write';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Calendar::class, inversedBy: 'groupShares')]
    #[ORM\JoinColumn(name: 'calendar_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Calendar $calendar = null;

    #[ORM\ManyToOne(targetEntity: MainGroup::class)]
    #[ORM\JoinColumn(name: 'group_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?MainGroup $group = null;

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

    public function getGroup(): ?MainGroup
    {
        return $this->group;
    }

    public function setGroup(?MainGroup $group): self
    {
        $this->group = $group;

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
