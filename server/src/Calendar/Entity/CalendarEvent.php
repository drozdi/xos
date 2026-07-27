<?php

namespace Calendar\Entity;

use Calendar\Repository\CalendarEventRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CalendarEventRepository::class)]
#[ORM\Table(name: 'calendar_event')]
#[ORM\Index(name: 'IDX_CALENDAR_EVENT_RANGE', columns: ['start_at', 'end_at'])]
#[ORM\HasLifecycleCallbacks]
class CalendarEvent
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Calendar::class, inversedBy: 'events')]
    #[ORM\JoinColumn(name: 'calendar_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Calendar $calendar = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'start_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $startAt = null;

    #[ORM\Column(name: 'end_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $endAt = null;

    #[ORM\Column(name: 'all_day', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $allDay = false;

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

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getStartAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->startAt) {
            return $this->startAt->format($format);
        }

        return $this->startAt;
    }

    public function setStartAt(?\DateTimeInterface $startAt): self
    {
        $this->startAt = $startAt;

        return $this;
    }

    public function getEndAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->endAt) {
            return $this->endAt->format($format);
        }

        return $this->endAt;
    }

    public function setEndAt(?\DateTimeInterface $endAt): self
    {
        $this->endAt = $endAt;

        return $this;
    }

    public function isAllDay(): bool
    {
        return $this->allDay;
    }

    public function setAllDay(bool $allDay): self
    {
        $this->allDay = $allDay;

        return $this;
    }
}
