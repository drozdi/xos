<?php


namespace App\Entity\iBlock;


use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Table(name: 'iblock_element')]
#[ORM\HasLifecycleCallbacks]
class Element {
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

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\ManyToOne(targetEntity: Block::class)]
    #[ORM\JoinColumn(name: 'block_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private $block;

    #[ORM\ManyToOne(targetEntity: Section::class)]
    #[ORM\JoinColumn(name: 'section_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private $section;

    #[ORM\Column(name: "code", length: 191, unique: true)]
    private ?string $code = null;

    #[ORM\Column(name: 'name', length: 255)]
    private ?string $name = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private ?int $sort = 100;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'preview_text', type: Types::TEXT, nullable: true)]
    private ?string $previewText = null;

    #[ORM\Column(name: 'detail_text', type: Types::TEXT, nullable: true)]
    private ?string $detailText = null;

    /*#[ORM\Column(name: 'preview_text', type: Types::INTEGER, nullable: true)]
    private ?string $previewPicture = null;*/

    /*#[ORM\Column(name: 'preview_text', type: Types::INTEGER, nullable: true)]
    private ?string $detailPicture = null;*/

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
    public function getDescription(): ?string {
        return $this->description;
    }
    public function setDescription(?string $description): self {
        $this->description = $description;
        return $this;
    }
    public function getPreviewText(): ?string {
        return $this->previewText;
    }
    public function setPreviewText(?string $previewText): self {
        $this->previewText = $previewText;
        return $this;
    }
    public function getdDtailText(): ?string {
        return $this->detailText;
    }
    public function setDetailText(?string $detailText): self {
        $this->detailText = $detailText;
        return $this;
    }
    public function getBlock (): ?Block {
        return $this->block;
    }
    public function setBlock (?Block $block = null): self {
        $this->block = $block;
        return $this;
    }
    public function getSection (): ?Section {
        return $this->section;
    }
    public function setSection (?Section $section = null): self {
        $this->section = $section;
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