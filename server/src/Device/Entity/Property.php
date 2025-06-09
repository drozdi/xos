<?php

namespace Device\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;

use Symfony\Component\Validator\Constraints as Assert;

use Device\Repository\PropertyRepository;

#[ORM\Table(name: 'd_property')]
#[ORM\UniqueConstraint(columns: ["parent_id", "code"])]
#[ORM\Entity(repositoryClass: PropertyRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Property {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    /**
     * One Property have Many Properties.
     * @var Collection<int, Type>
     */
    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    #[ORM\OrderBy(['sort' => "ASC", 'name' => "ASC"])]
    private Collection $children;

    /** One Property has One Type. */
    #[ORM\OneToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?Type $type = null;

    /**
     * Many Types have Many Properties.
     * @var Collection<int, Property>
     */
    #[ORM\ManyToMany(targetEntity: Type::class, mappedBy: "properties")]
    #[ORM\OrderBy(["sort" => "ASC"])]
    private Collection $types;

    #[ORM\ManyToOne(targetEntity: self::class)]
    #[ORM\JoinColumn(name: 'prototype_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?Property $prototype = null;

    /**
     * One Property have Many PropertyEnum.
     * @var Collection<int, PropertyEnum>
     */
    #[ORM\OneToMany(mappedBy: 'property', targetEntity: PropertyEnum::class)]
    #[ORM\OrderBy(["sort" => "ASC"])]
    private Collection $enums;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private bool $active = true;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;

    #[ORM\Column(name: "code", length: 191)]
    #[Assert\NotBlank(
        message: 'СODE должен быть указан'
    )]
    private ?string $code = null;

    #[ORM\Column(name: 'name', length: 255)]
    #[Assert\NotBlank(
        message: 'Название должно быть указано'
    )]
    private ?string $name = null;

    #[ORM\Column(name: 'required', type: Types::BOOLEAN, options: ["default" => false])]
    private bool $required = false;

    #[ORM\Column(name: 'multiple', type: Types::BOOLEAN, options: ["default" => false])]
    private bool $multiple = false;

    #[ORM\Column(name: 'field_type', length: 255, options: ["default" => 'S'])]
    private string $fieldType = 'S';

    #[ORM\Column(name: 'list_type', length: 255, options: ["default" => 'S'])]
    private string $listType = 'S';

    #[ORM\Column(name: 'default_value', length: 255, nullable: true)]
    private ?string $defaultValue = null;

    #[ORM\Column(name: 'postfix', length: 255, nullable: true)]
    private ?string $postfix = null;

    #[ORM\Column(name: 'prefix', length: 255, nullable: true)]
    private ?string $prefix = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    public function __construct () {
        $this->children = new ArrayCollection();
        $this->types = new ArrayCollection();
        $this->enums = new ArrayCollection();
    }

    public function getId (): ?int {
        return $this->id;
    }

    public function getParent (): ?self {
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
        return $this;
    }
    public function addChild (self $child): self {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
            if ($this->type) {
                $child->addType($this->type);
            }
        }
        return $this;
    }
    public function removeChild (self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
            if ($this->type) {
                $child->removeType($this->type);
            }
        }
        return $this;
    }
    /**
     * @return Collection<int, Type>
     */
    public function getChildren (): Collection {
        return $this->children;
    }

    public function getType (): ?Type {
        return $this->type;
    }
    public function setType (?Type $type = null): self {
        $setProperty = false;
        if ($this->type && $this->type !== $type) {
            $setProperty = true;
            foreach ($this->children as $child) {
                $child->removeType($this->type);
            }
            $this->type->setProperty(null);
        }
        $this->type = $type;
        if ($setProperty && $this->type) {
            $this->type->setProperty($this);
            foreach ($this->children as $child) {
                $child->addType($this->type);
            }
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
     * @return Collection<int, Type>
     */
    public function getTypes (): Collection {
        return $this->types;
    }

    public function getPrototype (): ?self {
        return $this->prototype;
    }
    public function setPrototype (?self $prototype = null): self {
        $this->prototype = $prototype;
        if (null != $this->prototype) {
            $this->setPostfix($this->prototype->getPostfix());
            $this->setFieldType($this->prototype->getFieldType());
        }
        return $this;
    }
    public function isPrototype (): bool {
        return $this->prototype != null;
    }


    public function newEnum (): PropertyEnum {
        $enum = new PropertyEnum;
        $this->addEnum($enum);
        return $enum;
    }
    public function addEnum (PropertyEnum $propertyEnum): self {
        if ($this->isPrototype()) {
            $this->prototype->addEnum($propertyEnum);
            return $this;
        }
        if (!$this->enums->contains($propertyEnum)) {
            $this->enums->add($propertyEnum);
            $propertyEnum->setProperty($this);
        }
        return $this;
    }
    public function removeEnum (PropertyEnum $propertyEnum): self {
        if ($this->isPrototype()) {
            $this->prototype->removeEnum($propertyEnum);
            return $this;
        }
        if ($this->enums->removeElement($propertyEnum)) {
            //$propertyEnum->setProperty(null);
        }
        return $this;
    }
    /**
     * @return Collection<int, PropertyEnum>
     */
    public function getEnums (): Collection {
        if ($this->isPrototype()) {
            return $this->prototype->getEnums();
        }
        return $this->enums;
    }


    public function getXTimestamp (?string $format = null): \DateTimeInterface|string|null {
        if ($format && $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp (?\DateTimeInterface $xTimestamp = null): self {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }

    public function isActive (bool $all = false): bool {
        if ($all && $this->active) {
            $d = new \DateTime();
            return (null === $this->activeFrom || $this->activeFrom->getTimestamp() < $d->getTimestamp()) &&
                (null === $this->activeTo || $d->getTimestamp() < $this->activeTo->getTimestamp());
        }
        return $this->active;
    }
    public function setActive (bool$active, bool $forType = true): self {
        $this->active = $active;
        if ($forType && $this->type) {
            $this->type->setActive($active, false);
        }
        return $this;
    }

    public function getActiveFrom (?string $format = null): \DateTimeInterface|string|null {
        if ($format && $this->activeFrom) {
            return $this->activeFrom->format($format);
        }
        return $this->activeFrom;
    }
    public function setActiveFrom (?\DateTimeInterface $activeFrom = null, bool $forType = true): self {
        $this->activeFrom = $activeFrom;
        if ($forType && $this->type) {
            $this->type->setActiveFrom($activeFrom, false);
        }
        return $this;
    }

    public function getActiveTo (?string $format = null): \DateTimeInterface|string|null {
        if ($format && $this->activeTo) {
            return $this->activeTo->format($format);
        }
        return $this->activeTo;
    }
    public function setActiveTo (?\DateTimeInterface $activeTo = null, bool $forType = true): self {
        $this->activeTo = $activeTo;
        if ($forType && $this->type) {
            $this->type->setActiveTo($activeTo, false);
        }
        return $this;
    }

    public function getSort (): int {
        return $this->sort;
    }
    public function setSort (int $sort, bool $forType = true): self {
        $this->sort = $sort;
        if ($forType && $this->type) {
            $this->type->setSort($sort, false);
        }
        return $this;
    }

    public function getCode(): ?string {
        return $this->code;
    }
    public function setCode(?string $code = null, bool $forType = true): self {
        $this->code = $code;
        if ($forType && $this->type) {
            $this->type->setCode($code, false);
        }
        return $this;
    }

    public function getName(): ?string {
        return $this->name;
    }
    public function setName(?string $name = null, bool $forType = true): self {
        $this->name = $name;
        if ($forType && $this->type) {
            $this->type->setName($name, false);
        }
        return $this;
    }

    public function getDescription (): ?string {
        return $this->description;
    }
    public function setDescription (?string $description): self {
        $this->description = $description;
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
    public function setMultiple ($multiple): self {
        $this->multiple = $multiple;
        return $this;
    }

    public function getFieldType (): string {
        return $this->fieldType;
    }
    public function setFieldType (string $fieldType): self {
        $this->fieldType = $fieldType;
        return $this;
    }

    public function getListType (): string {
        return $this->listType;
    }
    public function setListType (string $listType): self {
        $this->listType = $listType;
        return $this;
    }

    public function getDefaultValue (): mixed {
        if ($this->prototype) {
            return $this->prototype->getDefaultValue();
        }
        /*if ($this->fieldType === "L") {
            $res = [];
            foreach ($this->enums->toArray() as $enum) {
                if ($enum->isDefault()) {
                    if ($this->multiple === false) {
                        return $enum->getId();
                    }
                    $res[] = $enum->getId();
                }
            }
            return $res;
        }*/
        return $this->defaultValue;
    }
    public function setDefaultValue (?string $defaultValue = null): self {
        if ($this->prototype) {
            $this->prototype->setDefaultValue($defaultValue);
            return $this;
        }
        $this->defaultValue = $defaultValue;
        return $this;
    }

    public function getDefaultValueL (): mixed {
        if ($this->prototype) {
            return $this->prototype->getDefaultValueL();
        }
        $enums_def = [];
        foreach ($this->enums->toArray() as $enum) {
            if ($enum->isDefault() && $this->isMultiple()) {
                $enums_def[] = $enum->getId();
            } elseif ($enum->isDefault()) {
               return $enum->getId();
            }
        }
        return $enums_def;
    }

    public function getPostfix (): ?string {
        if ($this->prototype) {
            return $this->prototype->getPostfix();
        }
        return $this->postfix;
    }
    public function setPostfix (?string $postfix = null): self {
        if ($this->prototype) {
            $this->prototype->setPostfix($postfix);
            return $this;
        }
        $this->postfix = $postfix;
        return $this;
    }

    public function getPrefix (): ?string {
        if ($this->prototype) {
            return $this->prototype->getPrefix();
        }
        return $this->prefix;
    }
    public function setPrefix (?string $prefix = null): self {
        if ($this->prototype) {
            $this->prototype->setPostfix($prefix);
            return $this;
        }
        $this->prefix = $prefix;
        return $this;
    }

    public function isRoot (): bool {
        return null == $this->parent && $this->children->count() > 0;
    }
    public function isChild (): bool {
        return null != $this->parent;
    }


    #[ORM\PrePersist]
    public function prePersist (): void {

    }
    #[ORM\PreUpdate]
    public function preUpdate (): void {

    }
    #[ORM\PreFlush]
    public function preFlush (): void {

    }
    #[ORM\PreRemove]
    public function preRemove (): void {

    }
}
