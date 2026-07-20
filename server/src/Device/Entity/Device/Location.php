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
class Location
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    #[ORM\Version]
    private $xTimestamp;

    #[ORM\Column(name: 'date', type: Types::DATE_MUTABLE, nullable: false, unique: false)]
    private $date;

    #[ORM\Column(name: 'place', length: 255, nullable: false, unique: false)]
    private $place;

    #[ORM\Column(name: 'responsible', length: 255, nullable: false, unique: false)]
    private $responsible;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'locations')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $device;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->setDate(new \DateTime);
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
     * Set xTimestamp
     *
     * @param \DateTime $xTimestamp
     *
     * @return Device
     */
    public function setXTimestamp($xTimestamp)
    {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    /**
     * Get xTimestamp
     *
     * @return \DateTime
     */
    public function getXTimestamp()
    {
        return $this->xTimestamp;
    }

    /**
     * Set date
     *
     * @param \DateTime $date
     *
     * @return \Device\Entity\Device\Location
     */
    public function setDate($date)
    {
        $this->date = $date;

        return $this;
    }

    /**
     * Get date
     *
     * @return \DateTime
     */
    public function getDate()
    {
        return $this->date;
    }

    /**
     * Set place
     *
     * @param string $place
     *
     * @return \Device\Entity\Device\Location
     */
    public function setPlace($place)
    {
        $this->place = $place;

        return $this;
    }

    /**
     * Get place
     *
     * @return string
     */
    public function getPlace()
    {
        return $this->place;
    }

    /**
     * Set responsible
     *
     * @param string $responsible
     *
     * @return \Device\Entity\Device\Location
     */
    public function setResponsible($responsible)
    {
        $this->responsible = $responsible;

        return $this;
    }

    /**
     * Get responsible
     *
     * @return string
     */
    public function getResponsible()
    {
        return $this->responsible;
    }

    /**
     * Set device
     *
     * @param \Device\Entity\Device $device
     * @param boolean $addLocation[true]
     *
     * @return \Device\Entity\Device\Location
     */
    public function setDevice(\Device\Entity\Device $device = null, $addLocation = true)
    {
        if ((null === $device || $this->device !== $device) && null !== $this->device) {
            $this->device->removeLocation($this, false);
        }

        $this->device = $device;

        if (true === $addLocation && null !== $this->device) {
            $this->device->addLocation($this, false);
        }

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

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate(LifecycleEventArgs $event)
    {
        $errors = array();

        if (null == $this->device) {
            $errors[] = 'Не выбрано устройство!';
        }
        if (null == $this->place) {
            $errors[] = 'Не указано где располагается!';
        }
        if (null == $this->responsible) {
            $errors[] = 'Не указан ответственный!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}

