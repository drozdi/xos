<?php

namespace Device\Entity;

use Device\Repository\PropertyEnumRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_property_enum')]
#[ORM\UniqueConstraint(columns: ["property_id", "value"])]
#[ORM\Entity(repositoryClass: PropertyEnumRepository::class)]
#[ORM\HasLifecycleCallbacks]
class PropertyEnum {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    #[ORM\Version]
    private $xTimestamp;
    #[ORM\ManyToOne(targetEntity: Property::class, inversedBy: 'enums')]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private $property;
    #[ORM\Column(name: '`default`', type: Types::BOOLEAN, nullable: false, unique: false, options: ['default' => false])]
    private $default = 0;
    #[ORM\Column(name: 'value', length: 255, nullable: false, unique: false)]
    private $value;
    #[ORM\Column(name: 'name', length: 255, nullable: true, unique: false)]
    private $name;
    #[ORM\Column(name: 'sort', type: Types::INTEGER, nullable: false, unique: false, options: ['default' => 100])]
    private $sort = 100;

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
     * @return Property
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
     * Set property
     *
     * @param Property $property
     * @param boolean $addEnum[true]
     *
     * @return PropertyEnum
     */
    public function setProperty (Property $property = null, $addEnum = true) {
        if (null !== $this->property) {
            $this->property->removeEnum($this, false);
        }

        $this->property = $property;

        if (true === $addEnum && null !== $this->property) {
            $this->property->addEnum($this, false);
        }

        return $this;
    }

    /**
     * Get parent
     *
     * @return \Device\Entity\Property
     */
    public function getProperty () {
        return $this->property;
    }

    /**
     * Set default
     *
     * @param boolean $default
     *
     * @return PropertyEnum
     */
    public function setDefault ($default) {
        $this->default = $default;

        return $this;
    }

    /**
     * Get default
     *
     * @return boolean
     */
    public function getDefault () {
        return $this->default;
    }

    /**
     * Set value
     *
     * @param string $value
     *
     * @return \Device\Entity\Property
     */
    public function setValue ($value) {
        $this->value = $value;

        return $this;
    }

    /**
     * Get value
     *
     * @return string
     */
    public function getValue () {
        return $this->value;
    }

    /**
     * Set name
     *
     * @param string $name
     *
     * @return Property
     */
    public function setName ($name) {
        $this->name = $name;

        return $this;
    }

    /**
     * Get name
     *
     * @param boolean $isValue[true]
     *
     * @return string
     */
    public function getName ($isValue = true) {
        if (!$this->name && $isValue) {
            return $this->value.$this->property->getPostfix();
        }
        return $this->name;
    }

    /**
     * Set sort
     *
     * @param integer $sort
     *
     * @return \Device\Entity\Property
     */
    public function setSort ($sort) {
        $this->sort = $sort;

        return $this;
    }

    /**
     * Get code
     *
     * @return integer
     */
    public function getSort () {
        return $this->sort;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if (null == $this->value) {
            $errors[] = 'Не ввели значение!';
        }
        $criteria = new Criteria();
        $criteria
            ->where(Criteria::expr()->neq('id', $this->id))
            ->andWhere(Criteria::expr()->eq('value', $this->value))
            ->andWhere(Criteria::expr()->eq('property', $this->property));
        if ($event->getEntityManager()->getRepository(PropertyEnum::class)->matching($criteria)->count() > 0) {
            $errors[] = $this->property->getId().' - Такое значение "'.$this->value.'" уже используется!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}
