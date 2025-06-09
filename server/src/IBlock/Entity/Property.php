<?php

namespace App\Entity\iBlock;

use App\Entity\Main\User\Group as UserGroup;

use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;


#[ORM\Table(name: 'iblock_property')]
#[ORM\UniqueConstraint(columns: ["parent_id", "code"])]
#[ORM\HasLifecycleCallbacks]
class Property {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private $id;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: 'date_created', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateCreated = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private self|null $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\OneToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private $type;

    #[ORM\ManyToMany(targetEntity: Type::class, mappedBy: "properties")]
    #[ORM\OrderBy(['sort' => "ASC"])]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    #[ORM\InverseJoinColumn(name: 'type_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    private $types;

    #[ORM\OneToMany(mappedBy: 'property', targetEntity: Property\Enum::class)]
    #[ORM\OrderBy(["sort" => "ASC"])]
    private $enums;

    #[ORM\Column(name: 'name', length: 255)]
    private ?string $name = null;

    #[ORM\Column(name: "code", length: 191, unique: true)]
    private ?string $code = null;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $active = true;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: 'required', type: Types::BOOLEAN, options: ["default" => false])]
    private ?bool $required = false;

    #[ORM\Column(name: 'multiple', type: Types::BOOLEAN, options: ["default" => false])]
    private ?bool $multiple = false;

    #[ORM\Column(name: 'field_type', length: 255, options: ["default" => 's'])]
    private ?string $fieldType = 's';

    #[ORM\Column(name: 'list_type', length: 255, options: ["default" => 's'])]
    private ?string $listType = 's';

    #[ORM\Column(name: 'default_value', length: 255, nullable: true)]
    private $defaultValue;

    #[ORM\Column(name: 'postfix', length: 255, nullable: true)]
    private $postfix;

    #[ORM\Column(name: 'prefix', length: 255, nullable: true)]
    private $prefix;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private $sort = 100;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private $description;


    /*
     * @var string
     *
     * @ORM\Column(name="field_type", type="string", columnDefinition="ENUM('S', 'N', 'L') NOT NULL DEFAULT 'S'")
     */
    //private $fieldType;
    /*
     * @var string
     *
     * @ORM\Column(name="list_type", type="string", columnDefinition="ENUM('S','C') NOT NULL DEFAULT 'S'")
     */
    //private $listType;

    /**
     * Constructor
     */
    public function __construct () {
        $this->children = new ArrayCollection();
        $this->types = new ArrayCollection();
        $this->enums = new ArrayCollection();
    }

    public function getId () {
        return $this->id;
    }
    public function getXTimestamp(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }
    public function getDateCreated(?string$format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->dateCreated) {
            return $this->dateCreated->format($format);
        }
        return $this->dateCreated;
    }
    public function setDateCreated(?\DateTimeInterface $dateCreated): self {
        $this->dateCreated = $dateCreated;
        return $this;
    }
    public function getParent (): self {
        return $this->parent;
    }
    public function setParent (?self $parent = null): self {
        if ($this->parent && $this->parent !== $parent) {
            $this->parent->removeChild($this);
        }
        $this->parent = $parent;
        if ($this->parent) {
            $this->parent->addChild($this);
        }
        if (null != $this->parent && null != ($type = $this->parent->getType())) {
            $this->addType($type);
        }
        return $this;
    }
    public function addChild (self $child): self {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }
        return $this;
    }
    public function removeChild (self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }
        return $this;
    }
    /**
     * @return Collection<int, Property>
     */
    public function getChildren () {
        return $this->childrens;
    }

    public function isRoot (): bool {
        return null == $this->parent && $this->children->count() > 0;
    }
    public function isChild (): bool {
        return null != $this->parent;
    }

    public function getType (): ?Type {
        return $this->type;
    }
    public function setType (?Type $type = null): self {
        if ($this->type && $this->type != $type) {
            $this->type->setProperty(null);
        }
        $this->type = $type;
        if (null != $this->type) {
            $this->type->setProperty($this);
        }
        return $this;
    }

    public function addType (Type $type): ?self {
        if (!$this->types->contains($type)) {
            $this->types->add($type);
            $type->addProperty($this);
        }
        return $this;
    }
    public function removeType (Type $type): ?self {
        if ($this->types->removeElement($type)) {
            $type->removeProperty($this);
        }
        return $this;
    }
    /**
     * @return Collection<int, Property>
     */
    public function getTypes (): Collection {
        return $this->types;
    }




    public function newEnum (): Property\Enum {
        $enum = new Property\Enum;

        $enum->setProperty($this);

        $this->addEnum($enum, false);

        return $enum;
    }
    public function addEnum (Property\Enum $propertyEnum): self {
        if (!$this->enums->contains($propertyEnum)) {
            $this->enums->add($propertyEnum);
            $propertyEnum->setProperty($this);
        }
        return $this;
    }
    public function removeEnum (Property\Enum $propertyEnum): self {
        if ($this->enums->removeElement($propertyEnum)) {
            $propertyEnum->setProperty(null);
        }
        return $this;
    }

    /**
     * @return Collection<int, Property\Enum>
     */
    public function getEnums () {
        return $this->enums;
    }





    public function getCode (): string {
        return $this->code;
    }
    public function setCode (string $code, bool $forType = true): self {
        $this->code = $code;
        if ($forType && null != $this->type) {
            $this->type->setCode($this->code, false);
        }
        return $this;
    }

    public function getName (): string {
        return $this->name;
    }
    public function setName (string $name, bool $forType = true): self {
        $this->name = $name;
        if ($forType && null != $this->type) {
            $this->type->setName($this->name, false);
        }
        return $this;
    }

    public function getActive (): bool {
        return $this->active;
    }
    public function setActive (bool $active, bool $forType = true): self {
        $this->active = $active;
        if ($forType && null != $this->type) {
            $this->type->setActive($active, false);
        }
        return $this;
    }


    public function getActiveFrom (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeFrom->format($format);
        }
        return $this->activeFrom;
    }
    public function setActiveFrom (?\DateTimeInterface $activeFrom = null, bool $forType = true): self {
        $this->activeFrom = $activeFrom;
        if ($forType && null != $this->type) {
            $this->type->setActiveFrom($activeFrom, false);
        }
        return $this;
    }

    public function getActiveTo (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeTo->format($format);
        }
        return $this->activeTo;
    }
    public function setActiveTo (?\DateTimeInterface $activeTo = null, bool $forType = true) {
        $this->activeTo = $activeTo;
        if ($forType && null != $this->type) {
            $this->type->setActiveTo($activeTo, false);
        }
        return $this;
    }

    public function isRequired (): bool {
        return $this->required;
    }
    public function setRequired (bool $required): self {
        $this->required = $required;
        return $this;
    }

    public function isMultiple (): bool {
        return $this->multiple;
    }
    public function setMultiple (bool $multiple): self {
        $this->multiple = $multiple;

        return $this;
    }

    public function getFieldType (): ?string {
        return $this->fieldType;
    }
    public function setFieldType (?string $fieldType = null): self {
        $this->fieldType = $fieldType;

        return $this;
    }

    public function getListType (): ?string {
        return $this->listType;
    }
    public function setListType (?string $listType = null): self {
        $this->listType = $listType;
        return $this;
    }

    public function getDefaultValue (): ?string {
        return $this->defaultValue;
    }
    public function setDefaultValue (?string $defaultValue = null): self {
        $this->defaultValue = $defaultValue;
        return $this;
    }

    public function getPostfix (): ?string {
        return $this->postfix;
    }
    public function setPostfix (?string $postfix = null): self {
        $this->postfix = $postfix;
        return $this;
    }

    public function getPrefix (): ?string {
        return $this->prefix;
    }
    public function setPrefix (?string $prefix = null): self {
        $this->prefix = $prefix;
        return $this;
    }

    public function getSort (): int {
        return $this->sort;
    }
    public function setSort (int $sort, $forType = true): self {
        $this->sort = $sort;
        if ($forType && null != $this->type) {
            $this->type->setSort($this->sort, false);
        }
        return $this;
    }

    public function getDescription (): ?string {
        return $this->description;
    }
    public function setDescription (?string $description = null): self {
        $this->description = $description;
        return $this;
    }






    public function preRemove (): void {

    }
    public function prePersist(): void {
        $this->dateCreated = new \DateTime();
        $this->xTimestamp = new \DateTime();
    }
    public function preUpdate(): void {
        $this->xTimestamp = new \DateTime();
    }
}

