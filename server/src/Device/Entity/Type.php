<?php

namespace Device\Entity;

use Device\Repository\TypeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\ArrayCollection;

#[ORM\Table(name: 'd_type')]
#[ORM\UniqueConstraint(columns: ["parent_id", "code"])]
#[ORM\Entity(repositoryClass: TypeRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Type {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    #[ORM\OneToMany(targetEntity: Type::class, mappedBy: 'parent')]
    #[ORM\OrderBy(['sort' => 'ASC', 'name' => 'ASC'])]
    private $children;
    #[ORM\ManyToOne(targetEntity: Type::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private $parent;
    #[ORM\Column(name: 'active', type: Types::BOOLEAN, nullable: false, unique: false, options: ['default' => true])]
    private $active = 1;
    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $activeFrom;
    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true, unique: false)]
    private $activeTo;
    #[ORM\Column(name: 'name', length: 255, nullable: false, unique: false)]
    private $name;
    #[ORM\Column(name: 'code', length: 255, nullable: false, unique: false)]
    private $code;
    #[ORM\Column(name: 'sort', type: Types::INTEGER, nullable: true, unique: false, options: ['default' => 100])]
    private $sort = 100;
    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true, unique: false)]
    private $description;
    #[ORM\OneToOne(targetEntity: Property::class)]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', unique: true, nullable: true, onDelete: 'CASCADE')]
    private $property;
    #[ORM\ManyToMany(targetEntity: Property::class, inversedBy: 'types')]
    #[ORM\JoinTable(name: 'd_type_property')]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'property_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\OrderBy(['sort' => 'ASC'])]
    private $properties;

    /**
     * Constructor
     */
    public function __construct () {
        $this->children = new ArrayCollection();
        $this->properties = new ArrayCollection();
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
     * Add child
     *
     * @param \Device\Entity\Type $child
     * @param boolean $setParent[true]
     *
     * @return \Device\Entity\Type
     */
    public function addChild (Type $child, $setParent = true) {
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
     * @param \Device\Entity\Type $child
     * @param boolean $removeParent[true]
     *
     * @return \Device\Entity\Type
     */
    public function removeChild (Type $child, $removeParent = true) {
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
     * Set parent
     *
     * @param \Device\Entity\Type $parent
     * @param boolean $addChild[true]
     *
     * @return \Device\Entity\Type
     */
    public function setParent (Type $parent = null, $addChild = true) {
        if ((null === $parent || $this->parent !== $parent) && null !== $this->parent) {
            $this->parent->removeChild($this, false);
        }

        $this->parent = $parent;

        if (true === $addChild && null != $this->parent) {
            $this->parent->addChild($this, false);
        }

        return $this;
    }

    /**
     * Get parent
     *
     * @return Type
     */
    public function getParent () {
        return $this->parent;
    }

    /**
     * Set active
     *
     * @param boolean $active
     * @param boolean $forProperty[true]
     *
     * @return Type
     */
    public function setActive ($active, $forProperty = true) {
        $this->active = $active;

        if (true === $forProperty && null != $this->property) {
            $this->property->setActive($active, false);
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
     * @param boolean $forProperty[true]
     *
     * @return Type
     */
    public function setActiveFrom ($activeFrom, $forProperty = true) {
        $this->activeFrom = $activeFrom;

        if (true === $forProperty && null != $this->property) {
            $this->property->setActiveFrom($activeFrom, false);
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
     * @param boolean $forProperty[true]
     *
     * @return Type
     */
    public function setActiveTo ($activeTo, $forProperty = true) {
        $this->activeTo = $activeTo;

        if (true === $forProperty && null != $this->property) {
            $this->property->setActiveTo($activeTo, false);
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
     * Set name
     *
     * @param string $name
     * @param boolean $forProperty[true]
     *
     * @return \Device\Entity\Type
     */
    public function setName ($name, $forProperty = true) {
        $this->name = $name;

        if (true === $forProperty && null != $this->property) {
            $this->property->setName($name, false);
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
     * Set code
     *
     * @param string $code
     * @param boolean $forProperty[true]
     *
     * @return \Device\Entity\Type
     */
    public function setCode ($code, $forProperty = true) {
        $this->code = $code;

        if (true === $forProperty && null != $this->property) {
            $this->property->setCode($code, false);
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
     * Set sort
     *
     * @param integer $sort
     * @param boolean $forProperty[true]
     *
     * @return \Device\Entity\Type
     */
    public function setSort ($sort, $forProperty = true) {
        $this->sort = $sort;

        if (true === $forProperty && null != $this->property) {
            $this->property->setSort($sort, false);
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
     * @param boolean $forProperty[true]
     *
     * @return Type
     */
    public function setDescription ($description, $forProperty = true) {
        $this->description = $description;

        if (true === $forProperty && null != $this->property) {
            $this->property->setDescription($description, false);
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
     * Set property
     *
     * @param \Device\Entity\Property $property
     * @param boolean $setType[true]
     *
     * @return \Device\Entity\Type
     */
    public function setProperty (Property $property = null, $setType = true) {
        if ((null === $property || $this->property !== $property) && null !== $this->property) {
            foreach ($this->property->getChildren() as $child) {
                $this->removeProperty($child, false);
            }
            if (true === $setType) {
                $this->property->setType(null, false);
            }
        }

        $this->property = $property;

        if (null != $this->property) {
            if ($name = $this->property->getName()) {
                $this->name = $name;
            }
            if ($code = $this->property->getCode()) {
                $this->code = $code;
            }
            if ($sort = $this->property->getSort()) {
                $this->sort = $sort;
            }
            if ($active = $this->property->getActive()) {
                $this->active = $active;
            }
            if ($activeFrom = $this->property->getActiveFrom()) {
                $this->activeFrom = $activeFrom;
            }
            if ($activeTo = $this->property->getActiveTo()) {
                $this->activeTo = $activeTo;
            }
        }

        if (true === $setType && null != $this->property) {
            $this->property->setType($this, false);
            foreach ($this->property->getChildren() as $subProperty) {
                $this->addProperty($subProperty, false);
            }
        }

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
     * Add property
     *
     * @param \Device\Entity\Property $property
     * @param boolean $addType[true]
     *
     * @return \Device\Entity\Type
     */
    public function addProperty (Property $property, $addType = true) {
        if (false === $this->properties->indexOf($property)) {
            $this->properties[] = $property;
        }

        if (true === $addType) {
            $property->addType($this, false);
        }

        return $this;
    }

    /**
     * Remove property
     *
     * @param \Device\Entity\Property $property
     * @param boolean $removeType[true]
     *
     * @return \Device\Entity\Type
     */
    public function removeProperty (Property $property, $removeType = true) {
        $this->properties->removeElement($property);

        if (true === $removeType) {
            $property->removeType($this, false);
        }

        return $this;
    }

    /**
     * Get properties
     *
     * @param boolean $all[true]
     *
     * @return \Doctrine\Common\Collections\Collection
     */
    public function getProperties ($all = true) {
        if (!$all) {
            return $this->properties;
        }
        $ret = array();
        if ($this->parent) {
            $ret = $this->parent->getProperties(false)->toArray();
        }
        $ret = array_merge($this->properties->toArray(), $ret);
        return new ArrayCollection($ret);
    }

    /**
     * Get prefix
     *
     * @return string
     */
    public function getPrefix () {
        if ($this->parent) {
            return $this->parent->getCode();
        }
        return $this->code;
    }

    /**
     * Check whether the root type
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
           return (null === $this->activeFrom || $this->activeFrom->getTimestamp() < $d->getTimestamp()) &&
           (null === $this->activeTo || $d->getTimestamp() < $this->activeTo->getTimestamp());

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
            $errors[] = 'Не ввели код!';
        }

        $criteria = new Criteria();
        $criteria
            ->where(Criteria::expr()->neq('id', $this->id))
            ->andWhere(Criteria::expr()->eq('code', $this->code))
            ->andWhere(Criteria::expr()->eq('parent', $this->parent));

        if ($event->getEntityManager()->getRepository(Type::class)->matching($criteria)->count() > 0) {
            $errors[] = 'Такой код типа уже используется!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }

    #[ORM\PreRemove]
    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        if ((int)$event->getEntityManager()->getRepository('Device\Entity\Device')->count(array(
                'type' => $this->id
            )) > 0) {
            $errors[] = 'Нельзя удалить тип "'.$this->getName().'" пока есть устройства этого типа!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }
    }
}
