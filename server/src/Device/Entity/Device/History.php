<?php

namespace Device\Entity\Device;

use Device\Entity\Device;
use Device\Repository\Device\HistoryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;


#[ORM\Table(name: 'd_device_history')]
#[ORM\Entity(repositoryClass: HistoryRepository::class)]
#[ORM\HasLifecycleCallbacks]
class History {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'histories')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: "CASCADE")]
    private Device $device;

    #[ORM\ManyToOne(targetEntity: Device::class)]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: false, onDelete: "CASCADE")]
    private Device $parent;

    #[ORM\Column(name: "date_placement", type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $datePlacement;

    #[ORM\Column(name: "execute", type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $execute = null;

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

    public function getDatePlacement (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->datePlacement) {
            return $this->datePlacement->format($format);
        }
        return $this->datePlacement;
    }
    public function setDatePlacement (\DateTimeInterface $datePlacement): self {
        $this->datePlacement = $datePlacement;

        return $this;
    }

    public function getExecute (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->execute) {
            return $this->execute->format($format);
        }
        return $this->execute;
    }
    public function setExecute (\DateTimeInterface $execute): self {
        $this->execute = $execute;

        return $this;
    }


    public function getDevice (): Device {
        return $this->device;
    }
    public function setDevice (Device $device): self {
        $this->device = $device;

        return $this;
    }

    public function getParent (): Device {
        return $this->parent;
    }
    public function setParent (Device $parent): self {
        $this->parent = $parent;

        return $this;
    }

    #[ORM\PrePersist]
    public function prePersist (PrePersistEventArgs $event): void {
        $this->datePlacement = new \DateTime();
    }
    #[ORM\PreUpdate]
    public function preUpdate (PreUpdateEventArgs $event): void {
        $errors = array();

        if (null == $this->device) {
            $errors[] = 'Не выбран компонент!';
        }
        if (null == $this->parent) {
            $errors[] = 'Не указано устройство где находилось!';
        }
        if (null == $this->datePlacement) {
            $errors[] = 'Не указана дата, когда поставили в устройство!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}

