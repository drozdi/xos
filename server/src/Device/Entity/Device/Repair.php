<?php

namespace Device\Entity\Device;

use Device\Entity\Device;
use Device\Repository\Device\RepairRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_device_repair')]
#[ORM\Entity(repositoryClass: RepairRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Repair {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: "put_into", type: Types::DATETIME_MUTABLE, nullable: false)]
    private ?\DateTimeInterface $putInto;

    #[ORM\Column(name: "received_from", type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $receivedFrom;

    #[ORM\Column(name: 'closed', type: Types::BOOLEAN, options: ["default" => false])]
    private bool $closed = false;

    #[ORM\Column(name: 'reason', type: Types::TEXT, nullable: false)]
    private string $reason;

    #[ORM\Column(name: 'repairman', length: 255)]
    private string $repairman;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'repairs')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: "CASCADE")]
    private Device $device;

    public function __construct () {
        $this->setPutInto(new \DateTime);
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

    public function getPutInto (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->putInto) {
            return $this->putInto->format($format);
        }
        return $this->putInto;
    }
    public function setPutInto (\DateTimeInterface $putInto): self {
        $this->putInto = $putInto;

        return $this;
    }

    public function getReceivedFrom (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->receivedFrom) {
            return $this->receivedFrom->format($format);
        }
        return $this->receivedFrom;
    }
    public function setReceivedFrom (\DateTimeInterface $receivedFrom): self {
        $this->receivedFrom = $receivedFrom;

        return $this;
    }

    public function isClosed (): bool {
        return $this->closed;
    }
    public function setClosed (bool $closed): self {
        $this->closed = $closed;

        return $this;
    }

    public function getReason (): string {
        return $this->reason;
    }
    public function setReason (string $reason): self {
        $this->reason = $reason;

        return $this;
    }

    public function getRepairman ():string {
        return $this->repairman;
    }
    public function setRepairman (string $repairman): self {
        $this->repairman = $repairman;

        return $this;
    }

    public function getDescription (): ?string {
        return $this->description;
    }
    public function setDescription (?string $description = null): self {
        $this->description = $description = trim($description);

        if (!empty($description)) {
            $this->setClosed(true);
            if (!$this->receivedFrom) {
                $this->setReceivedFrom(new \DateTime);
            }
        }

        return $this;
    }

    public function getDevice (): Device {
        return $this->device;
    }
    public function setDevice (Device $device): self {
        if ($this->device && ($this->device != $device)) {
            $this->device->removeRepair($this);
        }

        $this->device = $device;

        if ($this->device) {
            $this->device->addRepair($this);
        }

        return $this;
    }


    #[ORM\PrePersist]
    public function prePersist(PrePersistEventArgs $event): void {
        $errors = array();

        if (null == $this->device) {
            $errors[] = 'Не выбрано устройство!';
        }
        if (null == $this->putInto) {
            $errors[] = 'Не указана дата сдачи в ремонт!';
        }
        if (null == $this->reason) {
            $errors[] = 'Не указана причина ремонта!';
        }
        if (null == $this->repairman) {
            $errors[] = 'Не указан кто ремонтник!';
        }
        if ($this->closed) {
            if (null == $this->receivedFrom) {
                $errors[] = 'Не указана дата получения из ремонта!';
            }
            if (null == $this->description) {
                $errors[] = 'Не указаны сведенья о ремонте!';
            }
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
    #[ORM\PreUpdate]
    public function preUpdate(PreUpdateEventArgs $event): void {
        $errors = array();

        if (null == $this->device) {
            $errors[] = 'Не выбрано устройство!';
        }
        if (null == $this->putInto) {
            $errors[] = 'Не указана дата сдачи в ремонт!';
        }
        if (null == $this->reason) {
            $errors[] = 'Не указана причина ремонта!';
        }
        if (null == $this->repairman) {
            $errors[] = 'Не указан кто ремонтник!';
        }
        if ($this->closed) {
            if (null == $this->receivedFrom) {
                $errors[] = 'Не указана дата получения из ремонта!';
            }
            if (null == $this->description) {
                $errors[] = 'Не указаны сведенья о ремонте!';
            }
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}

