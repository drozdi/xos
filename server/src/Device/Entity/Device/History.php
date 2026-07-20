<?php

namespace Device\Entity\Device;

use Device\Entity\Device as DeviceEntity;
use Device\Repository\Device\HistoryRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_device_history')]
#[ORM\Entity(repositoryClass: HistoryRepository::class)]
#[ORM\HasLifecycleCallbacks]
class History
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    #[ORM\Version]
    private $xTimestamp;

    #[ORM\ManyToOne(targetEntity: DeviceEntity::class, inversedBy: 'histories')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $device;

    #[ORM\ManyToOne(targetEntity: DeviceEntity::class, inversedBy: 'devices')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $parent;

    #[ORM\Column(name: 'date_placement', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    private $datePlacement;

    #[ORM\Column(name: 'execute', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $execute;

    /**
     * Constructor
     */
    public function __construct () {
        $this->datePlacement = new \DateTime;
    }

    /**
     * Get id
     *
     * @return integer
     */
    public function getId () {
        return $this->id;
    }

    /**
     * Set xTimestamp
     *
     * @param \DateTime $xTimestamp
     *
     * @return History
     */
    public function setXTimestamp ($xTimestamp) {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    /**
     * Get xTimestamp
     *
     * @return \DateTime
     */
    public function getXTimestamp () {
        return $this->xTimestamp;
    }

    /**
     * Set dateCreated
     *
     * @param \DateTime $datePlacement
     *
     * @return History
     */
    public function setDatePlacement ($datePlacement) {
        $this->datePlacement = $datePlacement;

        return $this;
    }

    /**
     * Get dateCreated
     *
     * @return \DateTime
     */
    public function getDatePlacement () {
        return $this->datePlacement;
    }

    /**
     * Set execute
     *
     * @param \DateTime $execute
     *
     * @return History
     */
    public function setExecute ($execute) {
        $this->execute = $execute;

        return $this;
    }

    /**
     * Get execute
     *
     * @return \DateTime
     */
    public function getExecute () {
        return $this->execute;
    }

    /**
     * Set device
     *
     * @param \Device\Entity\Device $device
     *
     * @return History
     */
    public function setDevice (\Device\Entity\Device $device = null) {
        $this->device = $device;

        return $this;
    }

    /**
     * Get device
     *
     * @return \Device\Entity\Device
     */
    public function getDevice () {
        return $this->device;
    }

    /**
     * Set parent
     *
     * @param \Device\Entity\Device $parent
     *
     * @return History
     */
    public function setParent (\Device\Entity\Device $parent = null) {
        $this->parent = $parent;

        return $this;
    }

    /**
     * Get parent
     *
     * @return \Device\Entity\Device
     */
    public function getParent () {
        return $this->parent;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
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

