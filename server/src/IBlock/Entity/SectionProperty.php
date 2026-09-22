<?php

namespace IBlock\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use IBlock\Repository\SectionPropertyRepository;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SectionPropertyRepository::class)]
#[ORM\Table(name: 'iblock_section_property')]
#[ORM\UniqueConstraint(name: 'uniq_iblock_section_property', columns: ['section_id', 'property_id'])]
#[ORM\HasLifecycleCallbacks]
class SectionProperty
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Section::class)]
    #[ORM\JoinColumn(name: 'section_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull]
    private ?Section $section = null;

    #[ORM\ManyToOne(targetEntity: Property::class)]
    #[ORM\JoinColumn(name: 'property_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull]
    private ?Property $property = null;

    #[ORM\ManyToOne(targetEntity: Block::class)]
    #[ORM\JoinColumn(name: 'block_id', referencedColumnName: 'id', nullable: true, onDelete: 'CASCADE')]
    private ?Block $block = null;

    #[ORM\Column(name: 'smart_filter', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $smartFilter = false;

    #[ORM\Column(name: 'display_type', length: 32, options: ['default' => 'A'])]
    private string $displayType = 'A';

    #[ORM\Column(name: 'display_expanded', type: Types::BOOLEAN, options: ['default' => false])]
    private bool $displayExpanded = false;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ['default' => 100])]
    private int $sort = 100;

    #[ORM\Column(name: 'active', type: Types::BOOLEAN, options: ['default' => true])]
    private bool $active = true;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getSection(): ?Section
    {
        return $this->section;
    }

    public function setSection(?Section $section): self
    {
        $this->section = $section;

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

    public function getBlock(): ?Block
    {
        return $this->block;
    }

    public function setBlock(?Block $block): self
    {
        $this->block = $block;

        return $this;
    }

    public function isSmartFilter(): bool
    {
        return $this->smartFilter;
    }

    public function setSmartFilter(bool $smartFilter): self
    {
        $this->smartFilter = $smartFilter;

        return $this;
    }

    public function getDisplayType(): string
    {
        return $this->displayType;
    }

    public function setDisplayType(string $displayType): self
    {
        $this->displayType = $displayType;

        return $this;
    }

    public function isDisplayExpanded(): bool
    {
        return $this->displayExpanded;
    }

    public function setDisplayExpanded(bool $displayExpanded): self
    {
        $this->displayExpanded = $displayExpanded;

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

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): self
    {
        $this->active = $active;

        return $this;
    }
}
