<?php

namespace Device\Entity;


use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;

use Device\Repository\PropertyEnumRepository;

#[ORM\Table(name: 'd_property_enum')]
#[ORM\UniqueConstraint(columns: ["property_id", "code"])]
#[ORM\Entity(repositoryClass: PropertyEnumRepository::class)]
#[ORM\HasLifecycleCallbacks]
class PropertyEnum {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE)]
    #[ORM\Version]
    private \DateTimeInterface $xTimestamp;

    #[ORM\ManyToOne(targetEntity: Property::class, inversedBy: 'enums')]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', onDelete: "CASCADE")]
    private Property $property;

    #[ORM\Column(name: 'name', length: 255, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(name: "code", length: 191)]
    private string $code;

    #[ORM\Column(name: '`default`', type: Types::BOOLEAN, options: ["default" => false])]
    private bool $default = false;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;


    public function getId (): ?int {
        return $this->id;
    }

    public function getXTimestamp(?string $format = null): \DateTimeInterface|string {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp(\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }

    public function getProperty (): Property {
        return $this->property;
    }
    public function setProperty (Property $property): self {
        if (isset($this->property) && $this->property != $property) {
            $this->property->removeEnum($this);
        }
        $this->property = $property;
        if ($this->property) {
            $this->property->addEnum($this);
        }
        return $this;
    }


    public function isDefault (): bool {
        return $this->default;
    }
    public function setDefault (bool $default): self {
        $this->default = $default;
        return $this;
    }

    public function getCode (): string {
        return $this->code;
    }
    public function setCode (string $code): self {
        $this->code = $code;
        return $this;
    }

    public function getName (): ?string {
        return $this->name;
    }
    public function setName (?string $name = null): self {
        $this->name = $name;
        return $this;
    }

    public function getSort (): int {
        return $this->sort;
    }
    public function setSort ($sort): self {
        $this->sort = $sort;
        return $this;
    }

    #[ORM\PrePersist]
    public function prePersist (): void {
        $this->setDateCreated(new \DateTime());
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
