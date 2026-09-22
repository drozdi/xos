<?php

namespace IBlock\Entity;

use Doctrine\ORM\Mapping as ORM;
use IBlock\Repository\SectionElementRepository;

#[ORM\Entity(repositoryClass: SectionElementRepository::class)]
#[ORM\Table(name: 'iblock_section_element')]
#[ORM\UniqueConstraint(name: 'UNIQ_IBLOCK_SECTION_ELEMENT', columns: ['section_id', 'element_id', 'additional_property_id'])]
#[ORM\Index(columns: ['section_id'], name: 'IDX_IBLOCK_SE_SECTION')]
#[ORM\Index(columns: ['element_id'], name: 'IDX_IBLOCK_SE_ELEMENT')]
class SectionElement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Section::class)]
    #[ORM\JoinColumn(name: 'section_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Section $section = null;

    #[ORM\ManyToOne(targetEntity: Element::class, inversedBy: 'sectionLinks')]
    #[ORM\JoinColumn(name: 'element_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Element $element = null;

    /** Bitrix ADDITIONAL_PROPERTY_ID; 0 = ordinary bind. */
    #[ORM\Column(name: 'additional_property_id', type: 'integer', options: ['default' => 0])]
    private int $additionalPropertyId = 0;

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

    public function getElement(): ?Element
    {
        return $this->element;
    }

    public function setElement(?Element $element): self
    {
        $this->element = $element;

        return $this;
    }

    public function getAdditionalPropertyId(): int
    {
        return $this->additionalPropertyId;
    }

    public function setAdditionalPropertyId(int $additionalPropertyId): self
    {
        $this->additionalPropertyId = $additionalPropertyId;

        return $this;
    }
}
