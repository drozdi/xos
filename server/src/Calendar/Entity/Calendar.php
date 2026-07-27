<?php

namespace Calendar\Entity;

use Calendar\Repository\CalendarRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: CalendarRepository::class)]
#[ORM\Table(name: 'calendar')]
#[ORM\HasLifecycleCallbacks]
class Calendar
{
    public const TYPE_MASTER = 'master';
    public const TYPE_SLAVE = 'slave';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\Column(length: 32, options: ['default' => '#1975d2'])]
    private string $color = '#1975d2';

    /** Системный (master) или пользовательский (slave). */
    #[ORM\Column(name: 'type', length: 16, options: ['default' => self::TYPE_SLAVE])]
    private string $type = self::TYPE_SLAVE;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE)]
    private ?\DateTimeInterface $createdAt = null;

    /** @var Collection<int, CalendarEvent> */
    #[ORM\OneToMany(mappedBy: 'calendar', targetEntity: CalendarEvent::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['startAt' => 'ASC', 'id' => 'ASC'])]
    private Collection $events;

    /** @var Collection<int, CalendarShare> */
    #[ORM\OneToMany(mappedBy: 'calendar', targetEntity: CalendarShare::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $shares;

    /** @var Collection<int, CalendarGroupShare> */
    #[ORM\OneToMany(mappedBy: 'calendar', targetEntity: CalendarGroupShare::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $groupShares;

    public function __construct()
    {
        $this->events = new ArrayCollection();
        $this->shares = new ArrayCollection();
        $this->groupShares = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $now = new \DateTime();
        if (null === $this->createdAt) {
            $this->createdAt = $now;
        }
        $this->xTimestamp = $now;
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->xTimestamp = new \DateTime();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getXTimestamp(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }

        return $this->xTimestamp;
    }

    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self
    {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(?User $owner): self
    {
        $this->owner = $owner;

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

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): self
    {
        $this->color = $color;

        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): self
    {
        $this->type = $type;

        return $this;
    }

    public function isMaster(): bool
    {
        return self::TYPE_MASTER === $this->type;
    }

    public function isSlave(): bool
    {
        return self::TYPE_SLAVE === $this->type;
    }

    public function getCreatedAt(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->createdAt) {
            return $this->createdAt->format($format);
        }

        return $this->createdAt;
    }

    public function setCreatedAt(?\DateTimeInterface $createdAt): self
    {
        $this->createdAt = $createdAt;

        return $this;
    }

    /** @return Collection<int, CalendarEvent> */
    public function getEvents(): Collection
    {
        return $this->events;
    }

    public function addEvent(CalendarEvent $event): self
    {
        if (!$this->events->contains($event)) {
            $this->events->add($event);
            $event->setCalendar($this);
        }

        return $this;
    }

    public function removeEvent(CalendarEvent $event): self
    {
        $this->events->removeElement($event);

        return $this;
    }

    /** @return Collection<int, CalendarShare> */
    public function getShares(): Collection
    {
        return $this->shares;
    }

    public function addShare(CalendarShare $share): self
    {
        if (!$this->shares->contains($share)) {
            $this->shares->add($share);
            $share->setCalendar($this);
        }

        return $this;
    }

    public function removeShare(CalendarShare $share): self
    {
        $this->shares->removeElement($share);

        return $this;
    }

    /** @return Collection<int, CalendarGroupShare> */
    public function getGroupShares(): Collection
    {
        return $this->groupShares;
    }

    public function addGroupShare(CalendarGroupShare $share): self
    {
        if (!$this->groupShares->contains($share)) {
            $this->groupShares->add($share);
            $share->setCalendar($this);
        }

        return $this;
    }

    public function removeGroupShare(CalendarGroupShare $share): self
    {
        $this->groupShares->removeElement($share);

        return $this;
    }
}
