<?php

namespace Device\Entity\Device;

use Device\Entity\Device;
use Device\Repository\Device\RepairRepository;
use Doctrine\DBAL\Types\Types;
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
    private $id;

    #[ORM\Column(name: 'put_into', type: Types::DATE_MUTABLE, nullable: false, unique: false)]
    private $putInto;

    #[ORM\Column(name: 'received_from', type: Types::DATE_MUTABLE, nullable: true, unique: false)]
    private $receivedFrom;

    #[ORM\Column(name: 'closed', type: Types::BOOLEAN, nullable: false, unique: false, options: ['default' => false])]
    private $closed = 0;

    #[ORM\Column(name: 'reason', type: Types::TEXT, nullable: false, unique: false)]
    private $reason;

    #[ORM\Column(name: 'repairman', length: 255, nullable: false, unique: false)]
    private $repairman;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true, unique: false)]
    private $description;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'repairs')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $device;

    /**
     * Constructor
     */
    public function __construct () {
        $this->setPutInto(new \DateTime);
    }

    /**
     * Get id
     *
     * @return integer
     */
    public function getId()
    {
        return $this->id;
    }

    /**
     * Set putInto
     *
     * @param \DateTime $putInto
     *
     * @return \Device\Entity\Device\Repair
     */
    public function setPutInto($putInto)
    {
        $this->putInto = $putInto;

        return $this;
    }

    /**
     * Get putInto
     *
     * @return \DateTime
     */
    public function getPutInto()
    {
        return $this->putInto;
    }

    /**
     * Set receivedFrom
     *
     * @param \DateTime $receivedFrom
     *
     * @return \Device\Entity\Device\Repair
     */
    public function setReceivedFrom($receivedFrom)
    {
        $this->receivedFrom = $receivedFrom;

        $this->setClosed(null != $this->receivedFrom);

        return $this;
    }

    /**
     * Get receivedFrom
     *
     * @return \DateTime
     */
    public function getReceivedFrom()
    {
        return $this->receivedFrom;
    }

    /**
     * Set closed
     *
     * @param boolean $closed
     *
     * @return \Device\Entity\Device\Repair
     */
    public function setClosed($closed)
    {
        $this->closed = $closed;

        return $this;
    }

    /**
     * Get closed
     *
     * @return boolean
     */
    public function getClosed()
    {
        return $this->closed;
    }

    /**
     * Set reason
     *
     * @param string $reason
     *
     * @return \Device\Entity\Device\Repair
     */
    public function setReason($reason)
    {
        $this->reason = $reason;

        return $this;
    }

    /**
     * Get reason
     *
     * @return string
     */
    public function getReason()
    {
        return $this->reason;
    }

    /**
     * Set description
     *
     * @param string $description
     *
     * @return \Device\Entity\Device\Repair
     */
    public function setDescription($description)
    {
        $this->description = $description = trim($description);

        if (!empty($description)) {
            $this->setClosed(true);
            if (!$this->receivedFrom) {
                $this->setReceivedFrom(new \DateTime);
            }
        }

        return $this;
    }

    /**
     * Get description
     *
     * @return string
     */
    public function getDescription()
    {
        return $this->description;
    }

    /**
     * Set device
     *
     * @param \Device\Entity\Device $device
     * @param boolean $addRepair[true]
     *
     * @return \Device\Entity\Device\Repair
     */
    public function setDevice(\Device\Entity\Device $device = null, $addRepair = true)
    {
        if ((null === $device || $this->device !== $device) && null !== $this->device) {
            $this->device->removeRepair($this, false);
        }

        $this->device = $device;

        if (true === $addRepair && null !== $this->device) {
            $this->device->addRepair($this, false);
        }

        $this->device = $device;

        return $this;
    }

    /**
     * Get device
     *
     * @return \Device\Entity\Device
     */
    public function getDevice()
    {
        return $this->device;
    }

    /**
     * Set repairman
     *
     * @param string $repairman
     *
     * @return \Device\Entity\Device\Repair
     */
    public function setRepairman($repairman)
    {
        $this->repairman = $repairman;

        return $this;
    }

    /**
     * Get repairman
     *
     * @return string
     */
    public function getRepairman()
    {
        return $this->repairman;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate(LifecycleEventArgs $event)
    {
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

