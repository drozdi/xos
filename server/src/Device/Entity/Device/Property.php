<?php

namespace Device\Entity\Device;

use Device\Entity\Device;
use Device\Entity\Property as BaseProperty;
use Device\Entity\PropertyEnum;
use Device\Repository\Device\PropertyRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\ArrayCollection;

#[ORM\Table(name: 'd_device_property')]
#[ORM\Entity(repositoryClass: PropertyRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Property {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private $id;
    #[ORM\Column(name: 'value', length: 255, nullable: true, unique: false)]
    private $value;
    #[ORM\Column(name: 'value_s', length: 255, nullable: true, unique: false)]
    private $valueS;
    #[ORM\ManyToMany(targetEntity: PropertyEnum::class)]
    #[ORM\JoinTable(name: 'd_device_property_enum')]
    #[ORM\JoinColumn(name: 'device_property_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'enum_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\JoinColumn(name: 'device_property_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private $valueL;
    #[ORM\Column(name: 'value_n', type: Types::FLOAT, nullable: true, unique: false)]
    private $valueN;
    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: 'properties')]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private $device;
    #[ORM\ManyToOne(targetEntity: Device::class)]
    #[ORM\JoinColumn(name: 'sub_device_id', referencedColumnName: 'id', nullable: true, onDelete: 'RESTRICT')]
    private $subDevice;
    #[ORM\ManyToOne(targetEntity: BaseProperty::class)]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private $property;
    /**
     * Constructor
     */
    public function __construct () {
        $this->valueL = new ArrayCollection();
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
     * Set value
     *
     * @param string $value
     *
     * @return Property
     */
    public function setValue ($value) {
        $this->value = $value;
        if ("L" === $this->property->getFieldType()) {
            if (is_string($value)) {
                $value = array_map(function ($val) {
                    return trim($val);
                }, explode(',', $value));
            } else {
                $value = is_array($value)? $value: array($value);
            }
        } else {
            $this->setValueS((string)$value);
            $this->setValueN((float)$value);
        }
        return $this;
    }
    /**
     * Get value
     *
     * @return mixed
     */
    public function getValue ($val = true) {
        if (!$val) {
            return $this->value;
        }
        if ("L" === $this->property->getFieldType()) {
            return implode(', ', array_map(function ($enum) {
                return $enum->getName();
            }, $this->valueL->toArray()));
        } elseif ("N" === $this->property->getFieldType()) {
            return $this->getValueN();
        } elseif ("S" === $this->property->getFieldType()) {
            return $this->getValueS();
        }
        return $this->value;
    }

    /**
     * Set valueL
     *
     * @param \Device\Entity\PropertyEnum[] $valueL
     *
     * @return Property
     */
    public function setValueL ($values) {
        foreach ($values as $enum) {
            $this->addValueL($enum);
        }
        return $this;
    }
    /**
     * Get valueL
     *
     * @return ArrayCollection
     */
    public function getValueL () {
        return $this->valueL;
    }
    /**
     * Add valueL
     *
     * @param \Device\Entity\PropertyEnum $valueL
     *
     * @return Property
     */
    public function addValueL (\Device\Entity\PropertyEnum $valueL) {
        $this->valueL[] = $valueL;

        return $this;
    }
    /**
     * Remove valueL
     *
     * @param \Device\Entity\PropertyEnum $valueL
     *
     * @return Property
     */
    public function removeValueL (\Device\Entity\PropertyEnum $valueL) {
        $this->valueL->removeElement($valueL);

        return $this;
    }

    /**
     * Set valueS
     *
     * @param string $valueS
     *
     * @return Property
     */
    public function setValueS ($valueS) {
        $this->valueS = $valueS;

        return $this;
    }
    /**
     * Get valueL
     *
     * @return string
     */
    public function getValueS () {
        return $this->valueS;
    }
    /**
     * Set valueN
     *
     * @param string $valueN
     *
     * @return Property
     */
    public function setValueN ($valueN) {
        $this->valueN = $valueN;

        return $this;
    }
    /**
     * Get valueN
     *
     * @return string
     */
    public function getValueN () {
        return $this->valueN;
    }

    /**
     * Get unit
     *
     * @return string
     */
    public function getPostfix () {
        return $this->property->getPostfix();
    }

    /**
     * Set device
     *
     * @param \Device\Entity\Device $device
     * @param boolean $addProperty[true]
     *
     * @return Property
     */
    public function setDevice (\Device\Entity\Device $device = null, $addProperty = true) {
        if ((null === $device || $this->device !== $device) && null !== $this->device) {
            $this->device->removeProperty($this, false);
        }

        $this->device = $device;

        if (true === $addProperty && null !== $this->device) {
            $this->device->addProperty($this, false);
        }

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
     * Set device
     *
     * @param \Device\Entity\Device $subDevice
     *
     * @return Property
     */
    public function setSubDevice (\Device\Entity\Device $subDevice = null) {
        $this->subDevice = $subDevice;

        return $this;
    }

    /**
     * Get device
     *
     * @return \Device\Entity\Device
     */
    public function getSubDevice () {
        return $this->subDevice;
    }

    /**
     * Set property
     *
     * @param \Device\Entity\Property $property
     *
     * @return Property
     */
    public function setProperty (\Device\Entity\Property $property = null) {
        $this->property = $property;

        return $this;
    }

    /**
     * Get property
     *
     * @return \Device\Entity\Property
     */
    public function getProperty () {
        return $this->property;
    }

    /**
     * Check whether the root property
     *
     * @return boolean
     */
    public function isRoot () {
        if (null != $this->property) {
            return $this->property->isRoot();
        }
        return false;
    }

    /**
     * Get name
     *
     * @return string|null
     */
    public function getName () {
        if ($this->property) {
            return $this->property->getName();
        }
        return null;
    }

    /**
     * Get children
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getChildrens () {
        if (null != $this->property) {
            return $this->property->getChildrens();
        }
        return array();
    }

    /**
     * Is children
     *
     * @return  boolean
     */
    public function isChild () {
        if (null != $this->property && null != $this->device) {
            $type = $this->device->getType();
            if ($property = $this->property->getParent()) {
                return false !== $type->getProperties()->indexOf($property);
            }
        }
        return $this->property->isChild();
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if (null == $this->device) {
            $errors[] = 'Не выбрано устройство!';
        }
        if (null == $this->property) {
            $errors[] = 'Не выбрана характеристика!';
        }
        /*if (null == $this->value) {
            $errors[] = 'Не указано значение!';
        }*/

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}
