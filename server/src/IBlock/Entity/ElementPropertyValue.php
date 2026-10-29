<?php

namespace IBlock\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use IBlock\Entity\Property\Enum as PropertyEnum;
use IBlock\Repository\ElementPropertyValueRepository;
use Main\Entity\File as MainFile;

#[ORM\Entity(repositoryClass: ElementPropertyValueRepository::class)]
#[ORM\Table(name: 'iblock_element_property')]
#[ORM\Index(columns: ['element_id', 'property_id'], name: 'idx_iblock_ep_element_property')]
#[ORM\HasLifecycleCallbacks]
class ElementPropertyValue
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Element::class, inversedBy: 'propertyValues')]
    #[ORM\JoinColumn(name: 'element_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Element $element = null;

    #[ORM\ManyToOne(targetEntity: Property::class)]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Property $property = null;

    #[ORM\Column(name: 'value', type: Types::TEXT, nullable: true)]
    private ?string $value = null;

    #[ORM\Column(name: 'value_s', length: 255, nullable: true)]
    private ?string $valueS = null;

    #[ORM\Column(name: 'value_n', type: Types::FLOAT, nullable: true)]
    private ?float $valueN = null;

    /** @var Collection<int, PropertyEnum> */
    #[ORM\ManyToMany(targetEntity: PropertyEnum::class)]
    #[ORM\JoinTable(name: 'iblock_element_property_enum')]
    #[ORM\JoinColumn(name: 'element_property_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'enum_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Collection $valueL;

    #[ORM\ManyToOne(targetEntity: MainFile::class)]
    #[ORM\JoinColumn(name: 'value_file_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?MainFile $valueFile = null;

    #[ORM\ManyToOne(targetEntity: Element::class)]
    #[ORM\JoinColumn(name: 'value_element_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Element $valueElement = null;

    #[ORM\ManyToOne(targetEntity: Section::class)]
    #[ORM\JoinColumn(name: 'value_section_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Section $valueSection = null;

    #[ORM\Column(name: 'description', length: 255, nullable: true)]
    private ?string $description = null;

    /** Tuple index when this row belongs to a prototype (field_type P) value. */
    #[ORM\Column(name: 'group_index', type: Types::INTEGER, options: ['default' => 0])]
    private int $groupIndex = 0;

    public function __construct()
    {
        $this->valueL = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getElement(): ?Element
    {
        return $this->element;
    }

    public function setElement(?Element $element): self
    {
        $this->element = $element;

        return $this;
    }

    public function getProperty(): ?Property
    {
        return $this->property;
    }

    public function setProperty(?Property $property): self
    {
        $this->property = $property;

        return $this;
    }

    private function clearTypedRelations(): void
    {
        foreach ($this->valueL->toArray() as $enum) {
            $this->removeValueL($enum);
        }
        $this->valueFile = null;
        $this->valueElement = null;
        $this->valueSection = null;
        $this->value = null;
        $this->valueS = null;
        $this->valueN = null;
    }

    /**
     * Fill typed columns / relations from a property definition.
     *
     * @param mixed $value scalar|PropertyEnum|MainFile|Element|Section|list
     */
    public function setTypedValue(Property $property, mixed $value): self
    {
        $this->property = $property;
        $fieldType = strtoupper($property->getFieldType());
        $this->clearTypedRelations();

        if ('L' === $fieldType) {
            $enums = [];
            if ($value instanceof PropertyEnum) {
                $enums = [$value];
            } elseif (is_array($value) || $value instanceof \Traversable) {
                foreach ($value as $item) {
                    if ($item instanceof PropertyEnum) {
                        $enums[] = $item;
                    }
                }
            }
            foreach ($enums as $enum) {
                $this->addValueL($enum);
            }
            $this->value = implode(', ', array_map(
                static fn (PropertyEnum $enum): string => (string) $enum->getName(),
                $enums,
            ));

            return $this;
        }

        if ('F' === $fieldType) {
            if ($value instanceof MainFile) {
                $this->valueFile = $value;
                $name = $value->getOriginalName();
                $this->value = $name;
                $this->valueS = mb_substr($name, 0, 255);
                $this->valueN = null !== $value->getId() ? (float) $value->getId() : null;
            }

            return $this;
        }

        if ('E' === $fieldType) {
            if ($value instanceof Element) {
                $this->valueElement = $value;
                $name = (string) ($value->getName() ?: $value->getCode() ?: $value->getId());
                $this->value = $name;
                $this->valueS = mb_substr($name, 0, 255);
                $this->valueN = null !== $value->getId() ? (float) $value->getId() : null;
            }

            return $this;
        }

        if ('G' === $fieldType) {
            if ($value instanceof Section) {
                $this->valueSection = $value;
                $name = (string) ($value->getName() ?: $value->getCode() ?: $value->getId());
                $this->value = $name;
                $this->valueS = mb_substr($name, 0, 255);
                $this->valueN = null !== $value->getId() ? (float) $value->getId() : null;
            }

            return $this;
        }

        $scalar = is_scalar($value) || null === $value
            ? $value
            : json_encode($value, JSON_THROW_ON_ERROR);
        $string = null === $scalar ? null : (string) $scalar;
        $this->value = $string;
        $this->valueS = null === $string ? null : mb_substr($string, 0, 255);
        if ('N' === $fieldType || (null !== $string && is_numeric($string))) {
            $this->valueN = null === $string || '' === $string ? null : (float) $string;
        }

        return $this;
    }

    public function getValue(bool $display = false): mixed
    {
        if (!$display) {
            return $this->value;
        }

        $fieldType = strtoupper((string) $this->property?->getFieldType());
        if ('L' === $fieldType) {
            return implode(', ', array_map(
                static fn (PropertyEnum $enum): string => (string) $enum->getName(),
                $this->valueL->toArray(),
            ));
        }
        if ('F' === $fieldType) {
            return $this->valueFile?->getId();
        }
        if ('E' === $fieldType) {
            return $this->valueElement?->getId();
        }
        if ('G' === $fieldType) {
            return $this->valueSection?->getId();
        }
        if ('N' === $fieldType) {
            return $this->valueN;
        }
        if ('S' === $fieldType) {
            return $this->valueS;
        }

        return $this->value;
    }

    public function setValue(?string $value): self
    {
        $this->value = $value;

        return $this;
    }

    public function getValueS(): ?string
    {
        return $this->valueS;
    }

    public function setValueS(?string $valueS): self
    {
        $this->valueS = $valueS;

        return $this;
    }

    public function getValueN(): ?float
    {
        return $this->valueN;
    }

    public function setValueN(?float $valueN): self
    {
        $this->valueN = $valueN;

        return $this;
    }

    /** @deprecated BC alias for getValueN */
    public function getValueNum(): ?float
    {
        return $this->getValueN();
    }

    /** @deprecated BC alias for setValueN */
    public function setValueNum(?float $valueNum): self
    {
        return $this->setValueN($valueNum);
    }

    /** @return Collection<int, PropertyEnum> */
    public function getValueL(): Collection
    {
        return $this->valueL;
    }

    /** @param iterable<PropertyEnum> $values */
    public function setValueL(iterable $values): self
    {
        foreach ($this->valueL->toArray() as $enum) {
            $this->removeValueL($enum);
        }
        foreach ($values as $enum) {
            $this->addValueL($enum);
        }

        return $this;
    }

    public function addValueL(PropertyEnum $valueL): self
    {
        if (!$this->valueL->contains($valueL)) {
            $this->valueL->add($valueL);
        }

        return $this;
    }

    public function removeValueL(PropertyEnum $valueL): self
    {
        $this->valueL->removeElement($valueL);

        return $this;
    }

    public function getValueFile(): ?MainFile
    {
        return $this->valueFile;
    }

    public function setValueFile(?MainFile $valueFile): self
    {
        $this->valueFile = $valueFile;

        return $this;
    }

    public function getValueElement(): ?Element
    {
        return $this->valueElement;
    }

    public function setValueElement(?Element $valueElement): self
    {
        $this->valueElement = $valueElement;

        return $this;
    }

    public function getValueSection(): ?Section
    {
        return $this->valueSection;
    }

    public function setValueSection(?Section $valueSection): self
    {
        $this->valueSection = $valueSection;

        return $this;
    }

    /** @deprecated BC: first enum from valueL */
    public function getValueEnum(): ?PropertyEnum
    {
        $first = $this->valueL->first();

        return false === $first ? null : $first;
    }

    /** @deprecated BC: replace valueL with a single enum */
    public function setValueEnum(?PropertyEnum $valueEnum): self
    {
        foreach ($this->valueL->toArray() as $enum) {
            $this->removeValueL($enum);
        }
        if (null !== $valueEnum) {
            $this->addValueL($valueEnum);
        }

        return $this;
    }

    public function getGroupIndex(): int
    {
        return $this->groupIndex;
    }

    public function setGroupIndex(int $groupIndex): self
    {
        $this->groupIndex = $groupIndex;

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
}
