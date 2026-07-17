<?php

namespace Device\Entity;

use Device\Entity\Device\License as DeviceLicense;
use Device\Entity\Device\Repair;
use Device\Entity\Device\Location;
use Device\Entity\Device\History;
use Device\Entity\Device\Property as DeviceProperty;
use Main\Entity\File;
use Main\Entity\User;
use Device\Repository\DeviceRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\ArrayCollection;

#[ORM\Table(name: 'd_device')]
#[ORM\UniqueConstraint(columns: ["group_id", "code"])]
#[ORM\UniqueConstraint(columns: ["type_id", "sn"])]
#[ORM\Entity(repositoryClass: DeviceRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Device {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private $id;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    #[ORM\Version]
    private $xTimestamp;

    #[ORM\Column(name: 'date_created', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    private $dateCreated;

    #[ORM\Column(name: 'code', length: 255, nullable: true, unique: false)]
    private $code;

    #[ORM\Column(name: 'name', length: 255, nullable: false, unique: false)]
    private $name;

    #[ORM\Column(name: 'sn', length: 255, nullable: true, unique: false)]
    private $sn;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true, unique: false)]
    private $description;

    #[ORM\Column(name: 'log', type: Types::TEXT, nullable: true, unique: false)]
    private $log;

    #[ORM\OneToMany(targetEntity: Device::class, mappedBy: 'parent')]
    #[ORM\OrderBy(['sort' => 'ASC'])]
    private $children;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private $parent;

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'group_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private $group;

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private $type;

    #[ORM\OneToOne(targetEntity: Accounting::class, inversedBy: 'device')]
    #[ORM\JoinColumn(name: 'accounting_id', referencedColumnName: 'id', unique: true, nullable: true, onDelete: 'CASCADE')]
    private $accounting;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, nullable: true, unique: false, options: ['default' => 100])]
    private $sort = 100;

    #[ORM\OneToMany(targetEntity: DeviceProperty::class, mappedBy: 'device')]
    private $properties;

    #[ORM\OneToMany(targetEntity: History::class, mappedBy: 'device')]
    #[ORM\OrderBy(['datePlacement' => 'ASC'])]
    private $histories;

    #[ORM\OneToMany(targetEntity: Repair::class, mappedBy: 'device')]
    #[ORM\OrderBy(['putInto' => 'ASC'])]
    private $repairs;

    #[ORM\OneToMany(targetEntity: Location::class, mappedBy: 'device')]
    #[ORM\OrderBy(['date' => 'ASC', 'id' => 'ASC'])]
    private $locations;

    #[ORM\OneToOne(targetEntity: File::class)]
    #[ORM\JoinColumn(name: 'file_id', referencedColumnName: 'id', unique: true, nullable: true, onDelete: 'RESTRICT')]
    private $file;

    #[ORM\ManyToMany(targetEntity: File::class)]
    #[ORM\JoinTable(name: 'd_device_image')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'file_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private $images;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private $createdBy;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'modified_by', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private $modifiedBy;

    #[ORM\OneToMany(targetEntity: DeviceLicense::class, mappedBy: 'device')]
    private $licenses;

    /**
     * Constructor
     */
    public function __construct() {
        $this->children = new ArrayCollection();
        $this->properties = new ArrayCollection();
        $this->locations = new ArrayCollection();
        $this->histories = new ArrayCollection();
        $this->repairs = new ArrayCollection();
        $this->licenses = new ArrayCollection();

        $this->setDateCreated(new \DateTime);
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
     * Set dateCreated
     *
     * @param \DateTime $dateCreated
     *
     * @return Device
     */
    public function setDateCreated($dateCreated)
    {
        $this->dateCreated = $dateCreated;

        return $this;
    }

    /**
     * Get dateCreated
     *
     * @return \DateTime
     */
    public function getDateCreated()
    {
        return $this->dateCreated;
    }

    /**
     * Set code
     *
     * @param string $code
     *
     * @return Device
     */
    public function setCode($code)
    {
        $this->code = $code;

        return $this;
    }

    /**
     * Get code
     * @param boolean $autoPrefix[true]
     *
     * @return string
     */
    public function getCode($autoPrefix = true)
    {
        if ($autoPrefix && $this->type) {
            return $this->type->getPrefix().$this->code;
        }
        return $this->code;
    }

    /**
     * Set name
     *
     * @param string $name
     *
     * @return Device
     */
    public function setName($name)
    {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName()
    {
        return $this->name;
    }

    /**
     * Set sn
     *
     * @param string $sn
     *
     * @return Device
     */
    public function setSn($sn)
    {
        $this->sn = $sn;

        return $this;
    }

    /**
     * Get sn
     *
     * @return string
     */
    public function getSn()
    {
        return $this->sn;
    }

    /**
     * Set description
     *
     * @param string $description
     *
     * @return Device
     */
    public function setDescription($description)
    {
        $this->description = $description;

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
     * Set sort
     *
     * @param integer $sort
     *
     * @return \Device\Entity\Device
     */
    public function setSort($sort)
    {
        $this->sort = $sort;

        return $this;
    }

    /**
     * Get code
     *
     * @return integer
     */
    public function getSort()
    {
        return $this->sort;
    }

    /**
     * Add child
     *
     * @param \Device\Entity\Device $child
     * @param boolean $setParent[true]
     *
     * @return \Device\Entity\Device
     */
    public function addChild(Device $child, $setParent = true)
    {
        if (false === $this->children->indexOf($child)) {
            $this->children[] = $child;
        }

        if (true === $setParent) {
            $child->setParent($this, false);
        }

        return $this;
    }

    /**
     * Remove child
     *
     * @param \Device\Entity\Device $child
     * @param boolean $removeParent[true]
     *
     * @return \Device\Entity\Device
     */
    public function removeChild(\Device\Entity\Device $child, $removeParent = true)
    {
        $this->children->removeElement($child);

        foreach ($this->properties as $property) {
            if ($property->getSubDevice() === $child) {
                $this->removeProperty($property);
            }
        }

        if (true === $removeParent) {
            $child->setParent(null, false);
        }

        return $this;
    }

    /**
     * Get children
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getChildren()
    {
        return $this->children;
    }

    /**
     * Set parent
     *
     * @param \Device\Entity\Device $parent
     * @param boolean $addChild[true]
     *
     * @return \Device\Entity\Device
     */
    public function setParent (Device $parent = null, $addChild = true) {
        if ((null === $parent || $this->parent !== $parent) && null !== $this->parent) {
            $this->parent->removeChild($this, false);
        }

        $this->parent = $parent;

        if (true === $addChild && null !== $this->parent) {
            $this->parent->addChild($this, false);
        }

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

    /**
     * Set type
     *
     * @param \Device\Entity\Type $type
     *
     * @return \Device\Entity\Device
     */
    public function setType (Type $type = null) {
        $this->type = $type;

        if (null != $this->type) {
            $this->setGroup($this->type->getParent());
        } else {
            $this->setGroup(null);
        }

        return $this;
    }

    /**
     * Get type
     *
     * @return \Device\Entity\Type
     */
    public function getType () {
        return $this->type;
    }

    /**
     * Set type
     *
     * @param \Device\Entity\Type $type
     *
     * @return \Device\Entity\Device
     */
    public function setGroup (Type $type = null) {
        $this->group = $type;

        return $this;
    }

    /**
     * Get type
     *
     * @return \Device\Entity\Type
     */
    public function getGroup () {
        return $this->group;
    }
    /**
     * Set accounting
     *
     * @param \Device\Entity\Accounting $accounting
     * @param boolean #setDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function setAccounting (Accounting $accounting = null, $setDevice = true) {
        if ((null === $accounting || $this->accounting !== $accounting) && null !== $this->accounting) {
            $this->accounting->setDevice(null, false);
        }

        $this->accounting = $accounting;

        if (true === $setDevice && null != $this->accounting) {
            $this->accounting->setDevice($this, false);
        }

        return $this;
    }

    /**
     * Get accounting
     *
     * @return \Device\Entity\Accounting
     */
    public function getAccounting () {
        return $this->accounting;
    }

    /**
     * Set log
     *
     * @param string $log
     *
     * @return Device
     */
    public function setLog ($log) {
        $this->log = $log;

        return $this;
    }

    /**
     * Get log
     *
     * @return string
     */
    public function getLog () {
        return $this->log;
    }

    /**
     * Add log
     *
     * @param string $mes
     *
     * @return Device
     */
    public function addLog ($mes) {
        $this->log = $this->log.(new \DateTime)->format("d.m.Y H:i").": ".$mes."\n";

        return $this;
    }

    /**
     * New property
     *
     * @param \Device\Entity\Property $property
     *
     * @return \Device\Entity\Device\Property $property
     */
    public function newProperty (\Device\Entity\Property $property = null)
    {
        $prop = new \Device\Entity\Device\Property;

        $prop->setProperty($property);

        $this->addProperty($prop);

        return $prop;
    }

    /**
     * Add property
     *
     * @param \Device\Entity\Device\Property $property
     * @param boolean $setDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function addProperty(\Device\Entity\Device\Property $property, $setDevice = true)
    {
        if (false === $this->properties->indexOf($property)) {
            $this->properties[] = $property;
        }

        if (true === $setDevice) {
            $property->setDevice($this, false);
        }

        return $this;
    }

    /**
     * Remove property
     *
     * @param \Device\Entity\Device\Property $property
     * @param boolean $removeDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function removeProperty(\Device\Entity\Device\Property $property, $removeDevice = true)
    {
        $this->properties->removeElement($property);

        if (true === $removeDevice) {
            $property->setDevice(null, false);
        }

        return $this;
    }

    /**
     * Get properties
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getProperties()
    {
        return $this->properties;
    }

    /**
     * New history
     *
     * @param \Device\Entity\Device $device
     *
     * @return \Device\Entity\Device\History
     */
    public function newHistory(Device $device) {
        $history = new Device\History;

        $history
            ->setDevice($this)
            ->setParent($device);

        $this->addHistory($history);

        return $history;
    }
    /**
     * Add history
     *
     * @param \Device\Entity\Device\History $history
     *
     * @return Device
     */
    public function addHistory (Device\History $history) {
        if (false === $this->histories->indexOf($history)) {
            $this->histories[] = $history;
        }

        return $this;
    }
    /**
     * Remove history
     *
     * @param \Device\Entity\Device\History $history
     *
     * @return Device
     */
    public function removeHistory (Device\History $history) {
        $this->histories->removeElement($history);

        return $this;
    }
    /**
     * Get histories
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getHistories () {
        return $this->histories;
    }
    /**
     * New repair
     *
     * @return \Device\Entity\Device\Repair
     */
    public function newRepair () {
        $repair = new \Device\Entity\Device\Repair;

        $repair
            ->setDevice($this, false);

        $this->addRepair($repair, false);

        return $repair;
    }
    /**
     * Add repair
     *
     * @param \Device\Entity\Device\Repair $repair
     * @param boolean $setDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function addRepair (Device\Repair $repair, $setDevice = true) {
        if (false === $this->repairs->indexOf($repair)) {
            $this->repairs[] = $repair;
        }

        if (true === $setDevice) {
            $repair->setDevice($this, false);
        }

        return $this;
    }
    /**
     * Remove repair
     *
     * @param \Device\Entity\Device\Repair $repair
     * @param boolean $removeDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function removeRepair (Device\Repair $repair, $removeDevice = true) {
        $this->repairs->removeElement($repair);

        if (true === $removeDevice) {
            $repair->setDevice(null, false);
        }

        return $this;
    }
    /**
     * Get repairs
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getRepairs () {
        return $this->repairs;
    }

    /**
     * New location
     *
     * @return \Device\Entity\Device\Location
     */
    public function newLocation () {
        $location = new \Device\Entity\Device\Location;

        $location
            ->setDevice($this, false);

        $this->addLocation($location, false);

        return $location;
    }

    /**
     * Add location
     *
     * @param \Device\Entity\Device\Location $location
     * @param boolean $setDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function addLocation (Device\Location $location, $setDevice = true) {
        if (false === $this->locations->indexOf($location)) {
            $this->locations[] = $location;
        }

        if (true === $setDevice) {
            $location->setDevice($this, false);
        }

        return $this;
    }

    /**
     * Remove location
     *
     * @param \Device\Entity\Device\Location $location
     * @param boolean $removeDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function removeLocation (Device\Location $location, $removeDevice = true) {
        $this->locations->removeElement($location);

        if (true === $removeDevice) {
            $location->setDevice(null, false);
        }

        return $this;
    }

    /**
     * Get locations
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getLocations () {
        return $this->locations;
    }

    /**
     * Set file
     *
     * @param \Main\Entity\File $file
     *
     * @return \Device\Entity\Device
     */
    public function setFile (\Main\Entity\File $file = null) {
        $this->file = $file;

        return $this;
    }

    /**
     * Get file
     *
     * @return \Main\Entity\File
     */
    public function getFile () {
        return $this->file;
    }

    /**
     * Add property
     *
     * @param \Main\Entity\File $file
     *
     * @return \Device\Entity\Device
     */
    public function addImage (\Main\Entity\File $file) {
        if (false === $this->images->indexOf($file)) {
            $this->images[] = $file;
        }

        return $this;
    }

    /**
     * Remove property
     *
     * @param \Main\Entity\File $file
     *
     * @return \Device\Entity\Device
     */
    public function removeImage (\Main\Entity\File $file) {
        $this->images->removeElement($file);

        return $this;
    }

    /**
     * Get images
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getImages () {
        return $this->images;
    }
    /**
     * Set createdBy
     *
     * @param \Main\Entity\User $createdBy
     *
     * @return Device
     */
    public function setCreatedBy($createdBy)
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    /**
     * Get createdBy
     *
     * @return \Main\Entity\User
     */
    public function getCreatedBy()
    {
        return $this->createdBy;
    }

    /**
     * Set modifiedBy
     *
     * @param \Main\Entity\User $modifiedBy
     *
     * @return Device
     */
    public function setModifiedBy($modifiedBy)
    {
        $this->modifiedBy = $modifiedBy;

        return $this;
    }

    /**
     * Get modifiedBy
     *
     * @return \Main\Entity\User
     */
    public function getModifiedBy()
    {
        return $this->modifiedBy;
    }

    /**
     * New license
     *
     * @param \Device\Entity\License\Software $licenseSoftware
     *
     * @return \Device\Entity\Device\License
     */
    public function newLicense(\Device\Entity\License\Software $licenseSoftware)
    {
        $license = new \Device\Entity\Device\License;

        $license->setLicenseSoftware($licenseSoftware);

        $this->addLicense($license);

        return $license;
    }

    /**
     * Add license
     *
     * @param \Device\Entity\Device\License $license
     * @param boolean $setDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function addLicense(\Device\Entity\Device\License $license, $setDevice = true)
    {
        if (false === $this->licenses->indexOf($license)) {
            $this->licenses[] = $license;
        }

        if (true === $setDevice) {
            $license->setDevice($this, false);
        }

        return $this;
    }

    /**
     * Remove license
     *
     * @param \Device\Entity\Device\License $license
     * @param boolean $removeDevice[true]
     *
     * @return \Device\Entity\Device
     */
    public function removeLicense(\Device\Entity\Device\License $license, $removeDevice = true)
    {
        $this->licenses->removeElement($license);

        if (true === $removeDevice) {
            $license->setDevice(null, false);
        }

        return $this;
    }

    /**
     * Get licenses
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getLicenses()
    {
        return $this->licenses;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if (null == $this->type) {
            $errors[] = 'Не выбрали тип устройства(компонента)!';
        }
        if (null != $this->type && null != $this->type->getProperty()) {
            if (null == $this->name) {
                $errors[] = 'Не ввели название компонента!';
            }
        } elseif (null != $this->type) {
            if (null == $this->code) {
                $errors[] = 'Не ввели код устройства!';
            }
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('Device\Entity\Device\Property')->count(array(
                'subDevice' => $this->id
            )) > 0) {
            $errors[] = 'Нельзя удалить компонент "'.$this->getName().'", пока он установлен в устройстве!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}
