<?php

namespace Board\Entity;

use Board\Repository\ChecklistItemRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ChecklistItemRepository::class)]
#[ORM\Table(name: 'board_checklist_item')]
class ChecklistItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Checklist::class, inversedBy: 'items')]
    #[ORM\JoinColumn(name: 'checklist_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Checklist $checklist = null;

    #[ORM\Column(length: 512)]
    private string $text = '';

    #[ORM\Column(type: Types::BOOLEAN)]
    private bool $checked = false;

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 1024;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getChecklist(): ?Checklist
    {
        return $this->checklist;
    }

    public function setChecklist(?Checklist $checklist): self
    {
        $this->checklist = $checklist;

        return $this;
    }

    public function getText(): string
    {
        return $this->text;
    }

    public function setText(string $text): self
    {
        $this->text = $text;

        return $this;
    }

    public function isChecked(): bool
    {
        return $this->checked;
    }

    public function setChecked(bool $checked): self
    {
        $this->checked = $checked;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): self
    {
        $this->position = $position;

        return $this;
    }
}
