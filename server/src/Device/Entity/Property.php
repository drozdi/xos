<?php

namespace Device\Entity;

use Device\Entity\PropertyEnum;
use Device\Repository\PropertyRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

#[ORM\Table(name: 'd_property')]
#[ORM\UniqueConstraint(columns: ["parent_id", "code"])]
#[ORM\Entity(repositoryClass: PropertyRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Property {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    #[ORM\Version]
    private $xTimestamp;
    #[ORM\Column(name: 'date_created', type: Types::DATETIME_MUTABLE, nullable: false, unique: false)]
    private $dateCreated;
    #[ORM\ManyToOne(targetEntity: Property::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private $parent;
    #[ORM\OneToMany(targetEntity: Property::class, mappedBy: 'parent')]
    #[ORM\OrderBy(['sort' => 'ASC', 'name' => 'ASC'])]
    private $children;
    #[ORM\Column(name: 'code', length: 255, nullable: false, unique: false)]
    private $code;
    #[ORM\Column(name: 'name', length: 255, nullable: false, unique: false)]
    private $name;
    #[ORM\Column(name: 'active', type: Types::BOOLEAN, nullable: false, unique: false, options: ['default' => true])]
    private $active = 1;
    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $activeFrom;
    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $activeTo;
    #[ORM\Column(name: 'required', type: Types::BOOLEAN, nullable: false, unique: false, options: ['default' => false])]
    private $required = 0;
    #[ORM\Column(name: 'multiple', type: Types::BOOLEAN, nullable: false, unique: false, options: ['default' => false])]
    private $multiple = 0;
    #[ORM\Column(name: 'field_type', length: 255, options: ['default' => 'S'])]
    private $fieldType = 'S';
    #[ORM\Column(name: 'list_type', length: 255, options: ['default' => 'S'])]
    private $listType = 'S';
    #[ORM\Column(name: 'default_value', length: 255, nullable: true, unique: false)]
    private $defaultValue = '';
    #[ORM\Column(name: 'postfix', length: 255, nullable: true, unique: false)]
    private $postfix;
    #[ORM\Column(name: 'prefix', length: 255, nullable: true, unique: false)]
    private $prefix;
    #[ORM\Column(name: 'sort', type: Types::INTEGER, nullable: true, unique: false, options: ['default' => 100])]
    private $sort = 100;
    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true, unique: false)]
    private $description;
    #[ORM\OneToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, unique: true, onDelete: 'SET NULL')]
    private $type;
    #[ORM\ManyToOne(targetEntity: Property::class)]
    #[ORM\JoinColumn(name: 'prototype_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private $prototype;
    #[ORM\ManyToMany(targetEntity: Type::class, mappedBy: 'properties')]
    #[ORM\OrderBy(['sort' => 'ASC'])]
    private $types;
    #[ORM\OneToMany(targetEntity: PropertyEnum::class, mappedBy: 'property')]
    #[ORM\OrderBy(['sort' => 'ASC'])]
    private $enums;

    /**
     * Constructor
     */
    public function __construct () {
        $this->children = new \Doctrine\Common\Collections\ArrayCollection();
        $this->types = new \Doctrine\Common\Collections\ArrayCollection();
        $this->enums = new \Doctrine\Common\Collections\ArrayCollection();

        $this->setDateCreated(new \DateTime);
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
     * Set dateCreated
     *
     * @param \DateTime $dateCreated
     *
     * @return Property
     */
    public function setDateCreated ($dateCreated) {
        $this->dateCreated = $dateCreated;

        return $this;
    }

    /**
     * Get dateCreated
     *
     * @return \DateTime
     */
    public function getDateCreated () {
        return $this->dateCreated;
    }

    /**
     * Set parent
     *
     * @param \Device\Entity\Property $parent
     * @param boolean $addChild[true]
     *
     * @return \Device\Entity\Property
     */
    public function setParent (Property $parent = null, $addChild = true) {
        if ((null === $parent || $this->parent !== $parent) && null !== $this->parent) {
            $this->parent->removeChild($this, false);
        }

        $this->parent = $parent;

        if (true === $addChild && null != $this->parent) {
            $this->parent->addChild($this, false);
        }

        //???
        if (null != $this->parent && null != ($type = $this->parent->getType())) {
            $this->addType($type);
        }

        return $this;
    }

    /**
     * Get parent
     *
     * @return \Device\Entity\Property
     */
    public function getParent () {
        return $this->parent;
    }

    /**
     * Add child
     *
     * @param Property $child
     * @param boolean $setParent[true]
     *
     * @return Property
     */
    public function addChild (Property $child, $setParent = true) {
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
     * @param Property $child
     * @param boolean $removeParent[true]
     *
     * @return Property
     */
    public function removeChild (Property $child, $removeParent = true) {
        $this->children->removeElement($child);

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
    public function getChildren () {
        return $this->children;
    }

    /**
     * Set code
     *
     * @param string $code
     * @param boolean $forType[true]
     *
     * @return Property
     */
    public function setCode ($code, $forType = true) {
        $this->code = $code;

        if (true === $forType && null != $this->type) {
            $this->type->setCode($code, false);
        }

        return $this;
    }

    /**
     * Get code
     *
     * @return string
     */
    public function getCode () {
        return $this->code;
    }

    /**
     * Set name
     *
     * @param string $name
     * @param boolean $forType[true]
     *
     * @return Property
     */
    public function setName ($name, $forType = true) {
        $this->name = $name;

        if (true === $forType && null != $this->type) {
            $this->type->setName($name, false);
        }

        return $this;
    }

    /**
     * Get name
     *
     * @return string
     */
    public function getName () {
        return $this->name;
    }

    /**
     * Set active
     *
     * @param boolean $active
     * @param boolean $forType[true]
     *
     * @return Property
     */
    public function setActive ($active, $forType = true) {
        $this->active = $active;

        if (true === $forType && null != $this->type) {
            $this->type->setActive($active, false);
        }

        return $this;
    }

    /**
     * Get active
     *
     * @return boolean
     */
    public function getActive () {
        return $this->active;
    }

    /**
     * Set activeFrom
     *
     * @param \DateTime $activeFrom
     * @param boolean $forType[true]
     *
     * @return Property
     */
    public function setActiveFrom ($activeFrom, $forType = true) {
        $this->activeFrom = $activeFrom;

        if (true === $forType && null != $this->type) {
            $this->type->setActiveFrom($activeFrom, false);
        }

        return $this;
    }

    /**
     * Get activeFrom
     *
     * @return \DateTime
     */
    public function getActiveFrom () {
        return $this->activeFrom;
    }

    /**
     * Set activeTo
     *
     * @param \DateTime $activeTo
     * @param boolean $forType[true]
     *
     * @return Property
     */
    public function setActiveTo ($activeTo, $forType = true) {
        $this->activeTo = $activeTo;

        if (true === $forType && null != $this->type) {
            $this->type->setActiveTo($activeTo, false);
        }

        return $this;
    }

    /**
     * Get activeTo
     *
     * @return \DateTime
     */
    public function getActiveTo () {
        return $this->activeTo;
    }

    /**
     * Set required
     *
     * @param boolean $required
     *
     * @return Property
     */
    public function setRequired ($required) {
        $this->required = $required;

        return $this;
    }

    /**
     * Get required
     *
     * @return boolean
     */
    public function getRequired () {
        return $this->required;
    }

    public function isRequired(): bool
    {
        return (bool) $this->required;
    }

    /**
     * Set multiple
     *
     * @param boolean $multiple
     *
     * @return Property
     */
    public function setMultiple ($multiple) {
        $this->multiple = $multiple;

        return $this;
    }

    /**
     * Get multiple
     *
     * @return boolean
     */
    public function getMultiple () {
        return $this->multiple;
    }

    public function isMultiple(): bool
    {
        return (bool) $this->multiple;
    }

    /**
     * Set fieldType
     *
     * @param string $fieldType
     *
     * @return \Device\Entity\Property
     */
    public function setFieldType ($fieldType) {
        $this->fieldType = $fieldType;

        return $this;
    }

    /**
     * Get fieldType
     *
     * @return string
     */
    public function getFieldType () {
        return $this->fieldType;
    }

    /**
     * Set listType
     *
     * @param string $listType
     *
     * @return \Device\Entity\Property
     */
    public function setListType ($listType) {
        $this->listType = $listType;

        return $this;
    }

    /**
     * Get listType
     *
     * @return string
     */
    public function getListType () {
        return $this->listType;
    }

    /**
     * Set defaultValue
     *
     * @param string $defaultValue
     *
     * @return Property
     */
    public function setDefaultValue ($defaultValue) {
        $this->defaultValue = $defaultValue;

        return $this;
    }

    /**
     * Get defaultValue
     *
     * @return string
     */
    public function getDefaultValue () {
        return $this->defaultValue;
    }

    /**
     * Set postfix
     *
     * @param string $postfix
     *
     * @return Property
     */
    public function setPostfix ($postfix) {
        $this->postfix = $postfix;

        return $this;
    }

    /**
     * Get postfix
     *
     * @return string
     */
    public function getPostfix () {
        return $this->postfix;
    }

    /**
     * Set prefix
     *
     * @param string $prefix
     *
     * @return Property
     */
    public function setPrefix ($prefix) {
        $this->prefix = $prefix;

        return $this;
    }

    /**
     * Get prefix
     *
     * @return string
     */
    public function getPrefix () {
        return $this->prefix;
    }

    /**
     * Set sort
     *
     * @param integer $sort
     * @param boolean $forType[true]
     *
     * @return Property
     */
    public function setSort ($sort, $forType = true) {
        $this->sort = $sort;

        if (true == $forType && null != $this->type) {
            $this->type->setSort($sort, false);
        }

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

    /**
     * Set description
     *
     * @param string $description
     * @param boolean $forType[true]
     *
     * @return Property
     */
    public function setDescription ($description, $forType = true) {
        $this->description = $description;

        if (true == $forType && null != $this->type) {
            $this->type->setDescription($description, false);
        }

        return $this;
    }

    /**
     * Get description
     *
     * @return string
     */
    public function getDescription () {
        return $this->description;
    }

    /**
     * Set type
     *
     * @param \Device\Entity\Type $type
     * @param boolean $setProperty[true]
     *
     * @return Property
     */
    public function setType (Type $type = null, $setProperty = true) {
        if ((null === $type || $this->type !== $type) && null !== $this->type) {
            foreach ($this->children as $child) {
                $child->removeType($this->type, false);
            }
            if (true === $setProperty) {
                $this->type->setProperty(null, false);
            }
        }

        $this->type = $type;

        if (true === $setProperty && null != $this->type) {
            $this->type->setProperty($this, false);

            foreach ($this->children as $child) {
                $child->addType($this->type, false);
            }
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
     * Set prototype
     *
     * @param \Device\Entity\Property $prototype
     *
     * @return Property
     */
    public function setPrototype (Property $prototype = null) {
        $this->prototype = $prototype;

        if (null != $this->prototype) {
            $this->setPostfix($this->prototype->getPostfix());
            $this->setFieldType($this->prototype->getFieldType());
        }

        return $this;
    }

    /**
     * Get prototype
     *
     * @return \Device\Entity\Property
     */
    public function getPrototype () {
        return $this->prototype;
    }

    /**
     * Add type
     *
     * @param \Device\Entity\Type $type
     * @param boolean $addProperty[true]
     *
     * @return Property
     */
    public function addType (Type $type, $addProperty = true) {
        if (false === $this->types->indexOf($type)) {
            $this->types[] = $type;
        }

        if (true === $addProperty) {
            $type->addProperty($this, false);
        }

        return $this;
    }

    /**
     * Remove type
     *
     * @param \Device\Entity\Type $type
     * @param boolean $removeProperty[true]
     *
     * @return Property
     */
    public function removeType (Type $type, $removeProperty = true) {
        $this->types->removeElement($type);

        if (true === $removeProperty) {
            $type->removeProperty($this, false);
        }

        return $this;
    }

    /**
     * Get types
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getTypes () {
        return $this->types;
    }

    /**
     * New PropertyEnum
     *
     * @return \Device\Entity\PropertyEnum
     */
    public function newEnum () {
        $enum = new PropertyEnum;

        $enum->setProperty($this);

        $this->addEnum($enum, false);

        return $enum;
    }

    /**
     * Add PropertyEnum
     *
     * @param \Device\Entity\PropertyEnum $propertyEnum
     * @param boolean $setProperty[true]
     *
     * @return Property
     */
    public function addEnum (PropertyEnum $propertyEnum, $setProperty = true) {
        if (false === $this->enums->indexOf($propertyEnum)) {
            $this->enums[] = $propertyEnum;
        }

        if (true === $setProperty) {
            $propertyEnum->setProperty($this, false);
        }

        return $this;
    }

    /**
     * Remove PropertyEnum
     *
     * @param \Device\Entity\PropertyEnum $propertyEnum
     * @param boolean $removeProperty[true]
     *
     * @return Property
     */
    public function removeEnum (PropertyEnum $propertyEnum, $removeProperty = true) {
        $this->enums->removeElement($propertyEnum);

        if (true === $removeProperty) {
            $propertyEnum->setProperty(null, false);
        }

        return $this;
    }

    /**
     * Get types
     *
     * @param boolean $getProperty[true]
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getEnums ($getProperty = true) {
        if ($getProperty && $this->prototype) {
            return $this->prototype->getEnums();
        }
        return $this->enums;
    }

    /**
     * Check whether the root property
     *
     * @return boolean
     */
    public function isRoot () {
        return null == $this->parent && $this->children->count() > 0;
    }

    /**
     * Is children
     *
     * @return  boolean
     */
    public function isChild () {
        return null != $this->parent;
    }

    /**
     * Check is active
     *
     * @return boolean
     */
    public function isActive () {
        if ($this->active) {
            $d = new \DateTime();
            return (null == $this->activeFrom || $this->activeFrom < $d) &&
                (null == $this->activeTo || $d < $this->activeTo);

        }
        return false;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function preUpdate (LifecycleEventArgs $event) {
        $errors = array();

        if (null == $this->name) {
            $errors[] = 'Не ввели название!';
        }
        if (null == $this->code) {
            $errors[] = 'Не ввели код! "'.$this->name.'"';
        }
        $criteria = new Criteria();
        $criteria
            ->where(Criteria::expr()->neq('id', $this->id))
            ->andWhere(Criteria::expr()->eq('code', $this->code))
            ->andWhere(Criteria::expr()->eq('parent', $this->parent));

        if ($event->getEntityManager()->getRepository(Property::class)->matching($criteria)->count() > 0) {
            $errors[] = 'Такой код св-ва уже используется!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('Device\Entity\Device\Property')->count(array(
                'property' => $this->id
            )) > 0) {
            $errors[] = 'Нельзя удалить характеристику "' . $this->getName() . '" пока она используется для описания устройств!';
        }

        if ((int)$event->getEntityManager()->getRepository(Device\Property::class)->count(array(
                'property' => $this->children->toArray()
            )) > 0) {
            $errors[] = 'Нельзя удалить характеристику "' . $this->getName() . '" пока ее компоненты используется для описания устройств!';
        }

        if (null != $this->type) {
            if ((int)$event->getEntityManager()->getRepository('Device\Entity\Device')->count(array(
                    'type' => $this->type
                )) > 0) {
                $errors[] = 'Нельзя удалить характеристику (тип компонента) "' . $this->getName() . '" пока есть устройства этой характеристики!';
            }
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}
