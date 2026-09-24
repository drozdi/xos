<?php

namespace IBlock\Entity;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use IBlock\Repository\ElementRepository;
use Main\Entity\File as MainFile;
use Main\Entity\User;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ElementRepository::class)]
#[ORM\Table(name: 'iblock_element')]
#[ORM\UniqueConstraint(name: 'UNIQ_IBLOCK_ELEMENT_BLOCK_CODE', columns: ['block_id', 'code'])]
#[ORM\HasLifecycleCallbacks]
class Element
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

    #[ORM\Column(name: 'active_from', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeFrom = null;

    #[ORM\Column(name: 'active_to', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $activeTo = null;

    #[ORM\ManyToOne(targetEntity: Block::class)]
    #[ORM\JoinColumn(name: 'block_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Block $block = null;

    #[ORM\ManyToOne(targetEntity: Section::class)]
    #[ORM\JoinColumn(name: 'section_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?Section $section = null;

    #[ORM\Column(name: 'code', length: 191)]
    #[Assert\NotBlank]
    private ?string $code = null;

    #[ORM\Column(name: 'name', length: 255)]
    #[Assert\NotBlank]
    private ?string $name = null;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ['default' => 100])]
    private int $sort = 100;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'preview_text', type: Types::TEXT, nullable: true)]
    private ?string $previewText = null;

    #[ORM\Column(name: 'detail_text', type: Types::TEXT, nullable: true)]
    private ?string $detailText = null;

    #[ORM\ManyToOne(targetEntity: MainFile::class)]
    #[ORM\JoinColumn(name: 'preview_image_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?MainFile $previewImage = null;

    #[ORM\ManyToOne(targetEntity: MainFile::class)]
    #[ORM\JoinColumn(name: 'detail_image_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?MainFile $detailImage = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'created_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $createdBy = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'updated_by_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $updatedBy = null;

    /** @var Collection<int, ElementPropertyValue> */
    #[ORM\OneToMany(mappedBy: 'element', targetEntity: ElementPropertyValue::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $propertyValues;

    /** @var Collection<int, SectionElement> */
    #[ORM\OneToMany(mappedBy: 'element', targetEntity: SectionElement::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $sectionLinks;

    /** @var Collection<int, ElementShare> */
    #[ORM\OneToMany(mappedBy: 'element', targetEntity: ElementShare::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $shares;

    public function __construct()
    {
        $this->propertyValues = new ArrayCollection();
        $this->sectionLinks = new ArrayCollection();
        $this->shares = new ArrayCollection();
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

    public function isActive(bool $all = false): bool
    {
        if ($all && $this->block) {
            return $this->active && $this->block->isActive();
        }

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

    public function getPreviewText(): ?string
    {
        return $this->previewText;
    }

    public function setPreviewText(?string $previewText): self
    {
        $this->previewText = $previewText;

        return $this;
    }

    public function getDetailText(): ?string
    {
        return $this->detailText;
    }

    public function setDetailText(?string $detailText): self
    {
        $this->detailText = $detailText;

        return $this;
    }

    public function getPreviewImage(): ?MainFile
    {
        return $this->previewImage;
    }

    public function setPreviewImage(?MainFile $previewImage): self
    {
        $this->previewImage = $previewImage;

        return $this;
    }

    public function getDetailImage(): ?MainFile
    {
        return $this->detailImage;
    }

    public function setDetailImage(?MainFile $detailImage): self
    {
        $this->detailImage = $detailImage;

        return $this;
    }

    public function getBlock(): ?Block
    {
        return $this->block;
    }

    public function setBlock(?Block $block = null): self
    {
        $this->block = $block;

        return $this;
    }

    public function getSection(): ?Section
    {
        return $this->section;
    }

    public function setSection(?Section $section = null): self
    {
        $this->section = $section;

        return $this;
    }

    public function addPropertyValue(ElementPropertyValue $propertyValue): self
    {
        if (!$this->propertyValues->contains($propertyValue)) {
            $this->propertyValues->add($propertyValue);
            $propertyValue->setElement($this);
        }

        return $this;
    }

    public function removePropertyValue(ElementPropertyValue $propertyValue): self
    {
        if ($this->propertyValues->removeElement($propertyValue)) {
            if ($propertyValue->getElement() === $this) {
                $propertyValue->setElement(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, ElementPropertyValue> */
    public function getPropertyValues(): Collection
    {
        return $this->propertyValues;
    }

    public function addSectionLink(SectionElement $link): self
    {
        if (!$this->sectionLinks->contains($link)) {
            $this->sectionLinks->add($link);
            $link->setElement($this);
        }

        return $this;
    }

    public function removeSectionLink(SectionElement $link): self
    {
        if ($this->sectionLinks->removeElement($link)) {
            if ($link->getElement() === $this) {
                $link->setElement(null);
            }
        }

        return $this;
    }

    /** @return Collection<int, SectionElement> */
    public function getSectionLinks(): Collection
    {
        return $this->sectionLinks;
    }

    /** @return list<int> */
    public function getSectionIds(): array
    {
        $ids = [];
        foreach ($this->sectionLinks as $link) {
            $sid = $link->getSection()?->getId();
            if (null !== $sid) {
                $ids[] = $sid;
            }
        }

        return array_values(array_unique($ids));
    }

    public function getCreatedBy(): ?User
    {
        return $this->createdBy;
    }

    public function setCreatedBy(?User $createdBy): self
    {
        $this->createdBy = $createdBy;

        return $this;
    }

    public function getUpdatedBy(): ?User
    {
        return $this->updatedBy;
    }

    public function setUpdatedBy(?User $updatedBy): self
    {
        $this->updatedBy = $updatedBy;

        return $this;
    }

    /** @return Collection<int, ElementShare> */
    public function getShares(): Collection
    {
        return $this->shares;
    }

    public function addShare(ElementShare $share): self
    {
        if (!$this->shares->contains($share)) {
            $this->shares->add($share);
            $share->setElement($this);
        }

        return $this;
    }

    public function removeShare(ElementShare $share): self
    {
        if ($this->shares->removeElement($share)) {
            if ($share->getElement() === $this) {
                $share->setElement(null);
            }
        }

        return $this;
    }

    #[ORM\PrePersist]
    public function prePersist(): void
    {
        // x_timestamp managed by #[ORM\Version] — do not set in lifecycle callbacks
        $this->dateCreated = new \DateTime();
    }
}
