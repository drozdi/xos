<?php

namespace App\Entity\iBlock;

use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\ArrayCollection;

//#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'iblock_type')]
#[ORM\HasLifecycleCallbacks]
class Type {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\OneToOne(targetEntity: Property::class)]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private $property;

    /**
     * Many Types have Many Properties.
     * @var Collection<int, Property>
     */
    #[ORM\JoinTable(name: 'iblock_type_property')]
    #[ORM\ManyToMany(targetEntity: Property::class, inversedBy: "types")]
    #[ORM\OrderBy(["sort" => "ASC", 'name' => "ASC"])]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    #[ORM\InverseJoinColumn(name: 'property_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    private $properties;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $active = true;

    #[ORM\Column(name: 'sections', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $sections = true;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: "code", length: 191, unique: true)]
    private ?string $code = null;

    #[ORM\Column(name: 'name', length: 255)]
    private ?string $name = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private ?int $sort = 100;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    public function __construct () {
        $this->children = new ArrayCollection();
        $this->properties = new ArrayCollection();
    }

    public function getId(): ?int {
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

    public function getParent(): ?self {
        return $this->parent;
    }
    public function setParent(?self $parent = null): self {
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
     * @return Collection<int, Type>
     */
    public function getChildren (): Collection {
        return $this->children;
    }
    public function isRoot (): bool {
        return null == $this->parent && $this->children->count() > 0;
    }
    public function isChild (): bool {
        return null != $this->parent;
    }
    public function isActive (): bool {
        return $this->active;
    }
    public function setActive (bool$active): self {
        $this->active = $active;
        return $this;
    }
    public function isSections (): bool {
        return $this->sections;
    }
    public function setSections (bool $sections): self {
        $this->sections = $sections;
        return $this;
    }
    public function getActiveFrom (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeFrom->format($format);
        }
        return $this->activeFrom;
    }
    public function setActiveFrom (?\DateTimeInterface $activeFrom = null): self {
        $this->activeFrom = $activeFrom;
        return $this;
    }
    public function getActiveTo (?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeTo->format($format);
        }
        return $this->activeTo;
    }
    public function setActiveTo (?\DateTimeInterface $activeTo = null): self {
        $this->activeTo = $activeTo;
        return $this;
    }
    public function getCode(): ?string {
        return $this->code;
    }
    public function setCode(string $code): self {
        $this->code = $code;

        return $this;
    }
    public function getName(): ?string {
        return $this->name;
    }
    public function setName(string $name): self {
        $this->name = $name;

        return $this;
    }
    public function getSort(): ?int {
        return $this->sort;
    }
    public function setSort(int $sort): self {
        $this->sort = $sort;

        return $this;
    }

    public function getDescription(): ?string {
        return $this->description;
    }
    public function setDescription(?string $description): self {
        $this->description = $description;

        return $this;
    }


    public function getProperty (): ?Property {
        return $this->property;
    }
    public function setProperty (?Property $property = null): self {
        if ($this->property && $this->property != $property) {
            foreach ($this->property->getChildren() as $child) {
                $this->removeProperty($child);
            }
            $this->property->setType(null);
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
            if ($active = $this->property->isActive()) {
                $this->active = $active;
            }
            if ($activeFrom = $this->property->getActiveFrom()) {
                $this->activeFrom = $activeFrom;
            }
            if ($activeTo = $this->property->getActiveTo()) {
                $this->activeTo = $activeTo;
            }
            $this->property->setType($this);

            foreach ($this->property->getChildrens() as $child) {
                $this->addProperty($child);
            }
        }

        return $this;
    }


    public function addProperty (Property $property): self {
        if (!$this->properties->contains($property)) {
            $this->properties->add($property);
            $property->addType($this);
        }
        return $this;
    }
    public function removeProperty (Property $property): self {
        if ($this->properties->removeElement($property)) {
            $property->removeType($this);
        }
        return $this;
    }
    /**
     * @return Collection<int, Property>
     */
    public function getProperties (): Collection {
        return $this->properties;
    }



    public function preRemove (LifecycleEventArgs $event) {
        $errors = array();

        /*if ((int)$event->getEntityManager()->getRepository(Device::class)->count(array(
                'type' => $this->id
            )) > 0) {
            $errors[] = 'Нельзя удалить тип "'.$this->getName().'" пока есть устройства этого типа!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }*/
    }
    public function prePersist(): void {
        $this->xTimestamp = new \DateTime();
    }
    public function preUpdate(): void {
        $this->xTimestamp = new \DateTime();
    }
}

