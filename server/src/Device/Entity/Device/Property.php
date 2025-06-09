<?php

namespace Device\Entity\Device;

use Device\Entity\Device;
use Device\Entity\Property as BaseProperty;
use Device\Entity\PropertyEnum;
use Device\Repository\Device\PropertyRepository;
use Doctrine\Common\Collections\Collection;
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
    private ?int $id = null;

    #[ORM\Column(name: 'value', length: 255, nullable: true)]
    private ?string $value = null;

    #[ORM\Column(name: 'value_s', length: 255, nullable: true)]
    private ?string $valueS = null;

    #[ORM\Column(name: 'value_n', type: Types::FLOAT, nullable: true)]
    private ?float $valueN = null;

    /**
     * @var Collection<int, PropertyEnum>
     */
    #[ORM\JoinTable(name: 'd_device_property_enum')]
    #[ORM\JoinColumn(name: 'device_property_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    #[ORM\InverseJoinColumn(name: 'enum_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    #[ORM\ManyToMany(targetEntity: PropertyEnum::class)]
    private Collection $valueL;

    #[ORM\ManyToOne(targetEntity: Device::class, inversedBy: "properties")]
    #[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: false, onDelete: "CASCADE")]
    private ?Device $device = null;

    #[ORM\ManyToOne(targetEntity: Device::class)]
    #[ORM\JoinColumn(name: 'sub_device_id', referencedColumnName: 'id', nullable: true, onDelete: "RESTRICT")]
    private ?Device $subDevice = null;

    #[ORM\ManyToOne(targetEntity: BaseProperty::class)]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: false, onDelete: "RESTRICT")]
    private BaseProperty $property;

    public function __construct () {
        $this->valueL = new ArrayCollection();
    }

    public function getId (): ?int {
        return $this->id;
    }

    public function getValue (bool $val = true): mixed {
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
    public function setValue (mixed $value): self {
        $this->value = $value;
        if ("L" === $this->property->getFieldType()) {
            if (is_string($value)) {
                $value = array_map(function ($val) {
                    return trim($val);
                }, explode(',', $value));
            } else {
                $value = is_array($value)? $value: array($value);
            }

            //$this->setValueS((string)$value);
            //$this->setValueN((float)$value);
        } else {
            $this->setValueS((string)$value);
            $this->setValueN((float)$value);
        }
        return $this;
    }

    /**
     * @return Collection<int, PropertyEnum>
     */
    public function getValueL (): Collection {
        return $this->valueL;
    }
    public function setValueL (array $values): self {
        $this->valueL->clear();
        foreach ($values as $enum) {
            $this->addValueL($enum);
        }
        return $this;
    }
    public function addValueL (?PropertyEnum $valueL = null): self {
        if ($valueL && !$this->valueL->contains($valueL)) {
            $this->valueL->add($valueL);
        }

        return $this;
    }
    public function removeValueL (PropertyEnum $valueL): self {
        $this->valueL->removeElement($valueL);

        return $this;
    }

    public function getValueS (): ?string {
        return $this->valueS;
    }
    public function setValueS (?string $valueS = null): self {
        $this->valueS = $valueS;

        return $this;
    }

    public function getValueN (): ?string {
        return $this->valueN;
    }
    public function setValueN (?float $valueN = null): self {
        $this->valueN = $valueN;

        return $this;
    }

    public function getDevice (): Device {
        return $this->device;
    }
    public function setDevice (Device $device): self {
        if ($this->device && ($this->device !== $device)) {
            $this->device->removeProperty($this);
        }

        $this->device = $device;

        if ($this->device) {
            $this->device->addProperty($this);
        }

        return $this;
    }

    public function getSubDevice (): ?Device {
        return $this->subDevice;
    }
    public function setSubDevice (?Device $subDevice = null): self {
        $this->subDevice = $subDevice;

        return $this;
    }

    public function getProperty (): BaseProperty {
        return $this->property;
    }
    public function setProperty (BaseProperty $property = null) {
        $this->property = $property;

        return $this;
    }

    public function getPostfix (): ?string {
        return $this->property->getPostfix();
    }
    public function getPrefix (): ?string {
        return $this->property->getPrefix();
    }

    public function isRoot (): bool {
        if (null != $this->property) {
            return $this->property->isRoot();
        }
        return false;
    }
    public function isChild (): bool {
        if (null != $this->property && null != $this->device) {
            $type = $this->device->getType();
            if ($property = $this->property->getParent()) {
                return false !== $type->getProperties()->indexOf($property);
            }
        }
        return $this->property->isChild();
    }
    public function getName (): ?string {
        if ($this->property) {
            return $this->property->getName();
        }
        return null;
    }
    public function getChildren (): ?Collection {
        if (null != $this->property) {
            return $this->property->getChildren();
        }
        return null;
    }

    public function prePersist (LifecycleEventArgs $event) {
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
