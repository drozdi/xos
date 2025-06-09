<?php

namespace App\Entity\iBlock;

use App\Entity\iBlock\Property;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\ArrayCollection;

//#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'iblock_block')]
#[ORM\HasLifecycleCallbacks]
class Block {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: 'date_created', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateCreated = null;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $active = true;

    #[ORM\Column(name: 'sections', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $sections = true;

    #[ORM\Column(name: 'property', type: Types::BOOLEAN, options: ["default" => false])]
    private ?bool $property = false;

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

    #[ORM\ManyToOne(targetEntity: Type::class)]
    #[ORM\JoinColumn(name: 'type_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private $type;

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
    public function getDateCreated(?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->dateCreated) {
            return $this->dateCreated->format($format);
        }
        return $this->dateCreated;
    }
    public function setDateCreated(?\DateTimeInterface $dateCreated): self {
        $this->dateCreated = $dateCreated;
        return $this;
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
    public function isProperty (): bool {
        return $this->property;
    }
    public function setProperty (bool $property): self {
        $this->property = $property;
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
    public function getType (): ?Type {
        return $this->type;
    }
    public function setType (?Type $type = null): self {
        $this->type = $type;
        return $this;
    }

    public function prePersist(): void {
        $this->dateCreated = new \DateTime();
        $this->xTimestamp = new \DateTime();
    }
    public function preUpdate(): void {
        $this->xTimestamp = new \DateTime();
    }
}