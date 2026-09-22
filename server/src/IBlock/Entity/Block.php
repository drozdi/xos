<?php

namespace IBlock\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use IBlock\Repository\BlockRepository;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: BlockRepository::class)]
#[ORM\Table(name: 'iblock_block')]
#[ORM\UniqueConstraint(name: 'UNIQ_IBLOCK_BLOCK_TYPE_CODE', columns: ['type_id', 'code'])]
#[ORM\HasLifecycleCallbacks]
class Block
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

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $active = true;

    #[ORM\Column(name: 'sections', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $sections = true;

    #[ORM\Column(name: 'property', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $property = false;

    /** bind|tree|filter|bind_filter — how section_id filter resolves elements. */
    #[ORM\Column(name: 'section_mode', length: 32, options: ['default' => 'tree'])]
    private string $sectionMode = 'tree';

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\Column(name: 'code', length: 191)]
    #[Assert\NotBlank]
    private ?string $code = null;

    #[ORM\Column(name: 'name', length: 255)]
    #[Assert\NotBlank]
    private ?string $name = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ['default' => 100])]
    private int $sort = 100;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Type $type = null;

    /** @var Collection<int, Property> */
    #[ORM\OneToMany(mappedBy: 'block', targetEntity: Property::class)]
    #[ORM\OrderBy(['sort' => 'ASC'])]
    private Collection $properties;

    public function __construct()
    {
        $this->properties = new ArrayCollection();
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

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;

        return $this;
    }

    public function isSections(): bool
    {
        return $this->sections;
    }

    public function setSections(bool $sections): self
    {
        $this->sections = $sections;

        return $this;
    }

    public function isProperty(): bool
    {
        return $this->property;
    }

    public function setProperty(bool $property): self
    {
        $this->property = $property;

        return $this;
    }

    public function getSectionMode(): string
    {
        return $this->sectionMode;
    }

    public function setSectionMode(string $sectionMode): self
    {
        $allowed = ['bind', 'tree', 'filter', 'bind_filter'];
        if (!\in_array($sectionMode, $allowed, true)) {
            throw new \InvalidArgumentException('Invalid section_mode: '.$sectionMode);
        }
        $this->sectionMode = $sectionMode;

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

    public function setDescription(?string $description): self
    {
        $this->description = $description;

        return $this;
    }

    public function getType(): ?Type
    {
        return $this->type;
    }

    public function setType(?Type $type = null): self
    {
        $this->type = $type;

        return $this;
    }

    public function addProperty(Property $property): self
    {
        if (!$this->properties->contains($property)) {
            $this->properties->add($property);
            $property->setBlock($this);
        }

        return $this;
    }

    public function removeProperty(Property $property): self
    {
        if ($this->properties->removeElement($property)) {
            if ($property->getBlock() === $this) {
                $property->setBlock(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, Property> */
    public function getProperties(): Collection
    {
        return $this->properties;
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
