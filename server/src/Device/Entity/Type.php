<?php

namespace Device\Entity;

use Doctrine\ORM\Event\PreRemoveEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Event\PreFlushEventArgs;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;

use Device\Repository\TypeRepository;

#[ORM\Table(name: 'd_type')]
#[ORM\UniqueConstraint(columns: ["parent_id", "code"])]
#[ORM\Entity(repositoryClass: TypeRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Type {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    /**
     * One Type have Many Types.
     * @var Collection<int, Type>
     */
    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    #[ORM\OrderBy(['sort' => "ASC", 'name' => "ASC"])]
    private Collection $children;

    /** One Type has One Property. */
    #[ORM\OneToOne(targetEntity: Property::class)]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private ?Property $property = null;

    /**
     * Many Types have Many Properties.
     * @var Collection<int, Property>
     */
    #[ORM\ManyToMany(targetEntity: Property::class, inversedBy: "types")]
    #[ORM\JoinTable(name: 'd_type_property')]
    #[ORM\OrderBy(["sort" => "ASC"])]
    private Collection $properties;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE)]
    #[ORM\Version]
    private \DateTimeInterface $xTimestamp;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private bool $active = true;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;

    #[ORM\Column(name: "code", length: 191)]
    private string $code;

    #[ORM\Column(name: 'name', length: 255)]
    private string $name;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    public function __construct () {
        $this->children = new ArrayCollection();
        $this->properties = new ArrayCollection();
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

    public function getProperty (): ?Property {
        return $this->property;
    }
    public function setProperty (?Property $property = null): self {
        if ($this->property && $this->property !== $property) {
            foreach ($this->property->getChildren() as $child) {
                $this->removeProperty($child);
            }
            $this->property->setType(null);
        }
        $this->property = $property;

        if (null != $this->property && $this->property !== $property) {
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

    public function getXTimestamp (?string $format = null): \DateTimeInterface|string {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp(\DateTimeInterface $xTimestamp): self {
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
    public function setActive (bool $active, bool $forProperty = true): self {
        $this->active = $active;
        if ($forProperty && null != $this->property) {
            $this->property->setActive($active, false);
        }
        return $this;
    }

    public function getActiveFrom (?string $format = null): \DateTimeInterface|string {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeFrom->format($format);
        }
        return $this->activeFrom;
    }
    public function setActiveFrom (?\DateTimeInterface $activeFrom = null, bool $forProperty = true): self {
        $this->activeFrom = $activeFrom;
        if ($forProperty && null != $this->property) {
            $this->property->setActiveFrom($activeFrom, false);
        }
        return $this;
    }

    public function getActiveTo (?string $format = null): \DateTimeInterface|string {
        if (null != $format && null != $this->activeFrom) {
            return $this->activeTo->format($format);
        }
        return $this->activeTo;
    }
    public function setActiveTo (?\DateTimeInterface $activeTo = null, bool $forProperty = true): self {
        $this->activeTo = $activeTo;
        if ($forProperty && null != $this->property) {
            $this->property->setActiveTo($activeTo, false);
        }
        return $this;
    }

    public function getSort (): int {
        return $this->sort;
    }
    public function setSort (int $sort, bool $forProperty = true): self {
        $this->sort = $sort;
        if ($forProperty && null != $this->property) {
            $this->property->setSort($sort, false);
        }
        return $this;
    }

    public function getCode (): ?string {
        return $this->code;
    }
    public function setCode (string $code, bool $forProperty = true): self {
        $this->code = $code;
        if ($forProperty && null != $this->property) {
            $this->property->setCode($code, false);
        }
        return $this;
    }

    public function getName (): ?string {
        return $this->name;
    }
    public function setName (string $name, bool $forProperty = true): self {
        $this->name = $name;
        if ($forProperty && null != $this->property) {
            $this->property->setName($name, false);
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

    /**
     * Get prefix
     *
     * @return string
     */
    public function getPrefix (): string {
        if ($this->parent) {
            return $this->parent->getCode();
        }
        return $this->code;
    }

    #[ORM\PrePersist]
    public function prePersist (PrePersistEventArgs $event): void {

    }
    #[ORM\PreUpdate]
    public function preUpdate (PreUpdateEventArgs $event) {
        /*$errors = array();

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
        }*/
    }
    #[ORM\PreFlush]
    public function preFlush (PreFlushEventArgs $event) {

    }
    #[ORM\PreRemove]
    public function preRemove (PreRemoveEventArgs $event) {
        /*$errors = array();

        if ((int)$event->getEntityManager()->getRepository('App\Entity\Device\Device')->count(array(
                'type' => $this->id
            )) > 0) {
            $errors[] = 'Нельзя удалить тип "'.$this->getName().'" пока есть устройства этого типа!';
        }

        if (count($errors) > 0) {
            throw new \Exception(implode('<br />', $errors));
        }*/
    }
}
