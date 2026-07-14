<?php

namespace IBlock\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use IBlock\Entity\Property\Enum as PropertyEnum;
use IBlock\Repository\PropertyRepository;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PropertyRepository::class)]
#[ORM\Table(name: 'iblock_property')]
#[ORM\UniqueConstraint(columns: ['parent_id', 'code'])]
#[ORM\HasLifecycleCallbacks]
class Property
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: 'date_created', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateCreated = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?self $parent = null;

    /** @var Collection<int, self> */
    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\OneToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Type $type = null;

    /** @var Collection<int, Type> */
    #[ORM\ManyToMany(targetEntity: Type::class, mappedBy: 'properties')]
    #[ORM\OrderBy(['sort' => 'ASC'])]
    private Collection $types;

    /** @var Collection<int, PropertyEnum> */
    #[ORM\OneToMany(mappedBy: 'property', targetEntity: PropertyEnum::class)]
    #[ORM\OrderBy(['sort' => 'ASC'])]
    private Collection $enums;

    #[ORM\Column(name: 'name', length: 255)]
    #[Assert\NotBlank]
    private ?string $name = null;

    #[ORM\Column(name: 'code', length: 191, unique: true)]
    #[Assert\NotBlank]
    private ?string $code = null;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $active = true;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: 'required', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $required = false;

    #[ORM\Column(name: 'multiple', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $multiple = false;

    #[ORM\Column(name: 'field_type', length: 255, options: ['default' => 's'])]
    private string $fieldType = 's';

    #[ORM\Column(name: 'list_type', length: 255, options: ['default' => 's'])]
    private string $listType = 's';

    #[ORM\Column(name: 'default_value', length: 255, nullable: true)]
    private ?string $defaultValue = null;

    #[ORM\Column(name: 'postfix', length: 255, nullable: true)]
    private ?string $postfix = null;

    #[ORM\Column(name: 'prefix', length: 255, nullable: true)]
    private ?string $prefix = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ['default' => 100])]
    private int $sort = 100;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    public function __construct()
    {
        $this->children = new ArrayCollection();
        $this->types = new ArrayCollection();
        $this->enums = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getXTimestamp(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }

        return $this->xTimestamp;
    }

    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self
    {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getDateCreated(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->dateCreated) {
            return $this->dateCreated->format($format);
        }

        return $this->dateCreated;
    }

    public function setDateCreated(?\DateTimeInterface $dateCreated): self
    {
        $this->dateCreated = $dateCreated;

        return $this;
    }

    public function getParent(): ?self
    {
        return $this->parent;
    }

    public function setParent(?self $parent = null): self
    {
        if ($this->parent && $this->parent !== $parent) {
            $this->parent->removeChild($this);
        }
        $this->parent = $parent;
        if ($this->parent) {
            $this->parent->addChild($this);
        }
        if (null !== $this->parent && null !== ($type = $this->parent->getType())) {
            $this->addType($type);
        }

        return $this;
    }

    public function addChild(self $child): self
    {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }

        return $this;
    }

    public function removeChild(self $child): self
    {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, self> */
    public function getChildren(): Collection
    {
        return $this->children;
    }

    public function getType(): ?Type
    {
        return $this->type;
    }

    public function setType(?Type $type = null): self
    {
        if ($this->type && $this->type !== $type) {
            $oldType = $this->type;
            $this->type = null;
            if ($oldType->getProperty() === $this) {
                $oldType->setProperty(null);
            }
        }
        $this->type = $type;

        return $this;
    }

    public function addType(Type $type): self
    {
        if (!$this->types->contains($type)) {
            $this->types->add($type);
            $type->addProperty($this);
        }

        return $this;
    }

    public function removeType(Type $type): self
    {
        if ($this->types->removeElement($type)) {
            $type->removeProperty($this);
        }

        return $this;
    }

    /** @return Collection<int, Type> */
    public function getTypes(): Collection
    {
        return $this->types;
    }

    public function addEnum(PropertyEnum $propertyEnum): self
    {
        if (!$this->enums->contains($propertyEnum)) {
            $this->enums->add($propertyEnum);
            $propertyEnum->setProperty($this);
        }

        return $this;
    }

    public function removeEnum(PropertyEnum $propertyEnum): self
    {
        if ($this->enums->removeElement($propertyEnum)) {
            $propertyEnum->setProperty(null);
        }

        return $this;
    }

    /** @return Collection<int, PropertyEnum> */
    public function getEnums(): Collection
    {
        return $this->enums;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): self
    {
        $this->code = $code;

        return $this;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;

        return $this;
    }

    public function getActiveFrom(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->activeFrom) {
            return $this->activeFrom->format($format);
        }

        return $this->activeFrom;
    }

    public function setActiveFrom(?\DateTimeInterface $activeFrom = null): self
    {
        $this->activeFrom = $activeFrom;

        return $this;
    }

    public function getActiveTo(?string $format = null): \DateTimeInterface|string|null
    {
        if (null !== $format && null !== $this->activeTo) {
            return $this->activeTo->format($format);
        }

        return $this->activeTo;
    }

    public function setActiveTo(?\DateTimeInterface $activeTo = null): self
    {
        $this->activeTo = $activeTo;

        return $this;
    }

    public function isRequired(): bool
    {
        return $this->required;
    }

    public function setRequired(bool $required): self
    {
        $this->required = $required;

        return $this;
    }

    public function isMultiple(): bool
    {
        return $this->multiple;
    }

    public function setMultiple(bool $multiple): self
    {
        $this->multiple = $multiple;

        return $this;
    }

    public function getFieldType(): string
    {
        return $this->fieldType;
    }

    public function setFieldType(?string $fieldType = null): self
    {
        $this->fieldType = $fieldType ?? 's';

        return $this;
    }

    public function getListType(): string
    {
        return $this->listType;
    }

    public function setListType(?string $listType = null): self
    {
        $this->listType = $listType ?? 's';

        return $this;
    }

    public function getDefaultValue(): ?string
    {
        return $this->defaultValue;
    }

    public function setDefaultValue(?string $defaultValue = null): self
    {
        $this->defaultValue = $defaultValue;

        return $this;
    }

    public function getPostfix(): ?string
    {
        return $this->postfix;
    }

    public function setPostfix(?string $postfix = null): self
    {
        $this->postfix = $postfix;

        return $this;
    }

    public function getPrefix(): ?string
    {
        return $this->prefix;
    }

    public function setPrefix(?string $prefix = null): self
    {
        $this->prefix = $prefix;

        return $this;
    }

    public function getSort(): int
    {
        return $this->sort;
    }

    public function setSort(int $sort): self
    {
        $this->sort = $sort;

        return $this;
    }

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description = null): self
    {
        $this->description = $description;

        return $this;
    }

    #[ORM\PrePersist]
    public function prePersist(): void
    {
        $this->dateCreated = new \DateTime();
        $this->xTimestamp = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function preUpdate(): void
    {
        $this->xTimestamp = new \DateTime();
    }
}
