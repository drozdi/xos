<?php


namespace App\Entity\iBlock;


use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'iblock_section')]
#[ORM\HasLifecycleCallbacks]
class Section {
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

    #[ORM\Column(name: 'date_created', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateCreated = null;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ["default" => true])]
    private ?bool $active = true;

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\ManyToOne(targetEntity: Block::class)]
    #[ORM\JoinColumn(name: 'block_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private $block;

    #[ORM\Column(name: "code", length: 191, unique: true)]
    private ?string $code = null;

    #[ORM\Column(name: 'name', length: 255)]
    private ?string $name = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private ?int $sort = 100;

    #[ORM\Column(name: 'level', type: Types::INTEGER, options: ["default" => 0])]
    private ?int $level = 0;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    /*#[ORM\Column(name: 'picture', type: Types::INTEGER, nullable: true)]
    private ?string $previewPicture = null;*/


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
    public function getChildren () {
        return $this->children;
    }
    public function isRoot (): bool {
        return null == $this->parent && $this->children->count() > 0;
    }
    public function isChild (): bool {
        return null != $this->parent;
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
    public function isActive (bool $all = false): bool {
        if ($all && $this->block) {
            return $this->active && $this->block->isActive();
        }
        return $this->active;
    }
    public function setActive (bool$active): self {
        $this->active = $active;
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
    public function getLevel(): ?int {
        return $this->level;
    }
    public function setLevel(int $level): self {
        $this->level = $level;
        foreach ($this->children as $child) {
            $child->setLevel($this->level+1);
        }
        return $this;
    }
    public function getDescription(): ?string {
        return $this->description;
    }
    public function setDescription(?string $description): self {
        $this->description = $description;
        return $this;
    }
    public function getBlock (): ?Block {
        return $this->block;
    }
    public function setBlock (?Block $block = null): self {
        $this->block = $block;
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