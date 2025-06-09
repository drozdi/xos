<?php

namespace Device\Entity\Device;

use Device\Entity\Device;
use Device\Repository\Device\LocationRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_device_location')]
#[ORM\Entity(repositoryClass: LocationRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Location {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: "date", type: Types::DATETIME_MUTABLE, nullable: false)]
    private \DateTimeInterface $date;

    #[ORM\Column(name: "place", length: 255)]
    private string $place;

    #[ORM\Column(name: "responsible", length: 255)]
    private string $responsible;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'locations')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: "CASCADE")]
    private Device $device;

    public function __construct () {
        $this->setDate(new \DateTime);
    }

    public function getId (): ?int {
        return $this->id;
    }

    public function getXTimestamp (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp (\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getDate (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->date) {
            return $this->date->format($format);
        }
        return $this->date;
    }
    public function setDate (\DateTimeInterface $date): self {
        $this->date = $date;

        return $this;
    }

    public function getPlace(): string {
        return $this->place;
    }
    public function setPlace (string $place): self {
        $this->place = $place;

        return $this;
    }

    public function getResponsible (): string {
        return $this->responsible;
    }
    public function setResponsible (string $responsible): self {
        $this->responsible = $responsible;

        return $this;
    }

    public function getDevice (): Device {
        return $this->device;
    }
    public function setDevice (Device $device): self {
        if (isset($this->device) && ($this->device != $device)) {
            $this->device->removeLocation($this);
        }

        $this->device = $device;

        if ($this->device) {
            $this->device->addLocation($this);
        }

        return $this;
    }

}

