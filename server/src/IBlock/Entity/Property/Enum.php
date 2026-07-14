<?php

namespace IBlock\Entity\Property;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use IBlock\Entity\Property;
use IBlock\Repository\PropertyEnumRepository;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: PropertyEnumRepository::class)]
#[ORM\Table(name: 'iblock_property_enum')]
#[ORM\UniqueConstraint(columns: ['property_id', 'code'])]
#[ORM\HasLifecycleCallbacks]
class Enum
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'x_timestamp', type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: Property::class, inversedBy: 'enums')]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Property $property = null;

    #[ORM\Column(name: 'name', length: 255)]
    #[Assert\NotBlank]
    private ?string $name = null;

    #[ORM\Column(name: 'code', length: 191)]
    #[Assert\NotBlank]
    private ?string $code = null;

    #[ORM\Column(name: '`default`', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $default = false;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ['default' => 100])]
    private int $sort = 100;

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

    public function getProperty(): ?Property
    {
        return $this->property;
    }

    public function setProperty(?Property $property = null): self
    {
        if ($this->property && $this->property !== $property) {
            $this->property->removeEnum($this);
        }
        $this->property = $property;
        if ($this->property) {
            $this->property->addEnum($this);
        }

        return $this;
    }

    public function isDefault(): bool
    {
        return $this->default;
    }

    public function setDefault(bool $default): self
    {
        $this->default = $default;

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

    #[ORM\PrePersist]
    public function prePersist(): void
    {
        $this->xTimestamp = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function preUpdate(): void
    {
        $this->xTimestamp = new \DateTime();
    }
}
