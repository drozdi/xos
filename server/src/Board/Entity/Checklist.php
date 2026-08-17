<?php

namespace Board\Entity;

use Board\Repository\ChecklistRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ChecklistRepository::class)]
#[ORM\Table(name: 'board_checklist')]
class Checklist
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Card::class, inversedBy: 'checklists')]
    #[ORM\JoinColumn(name: 'card_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Card $card = null;

    #[ORM\Column(length: 255)]
    private string $title = '';

    #[ORM\Column(type: Types::INTEGER)]
    private int $position = 1024;

    /** @var Collection<int, ChecklistItem> */
    #[ORM\OneToMany(mappedBy: 'checklist', targetEntity: ChecklistItem::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[ORM\OrderBy(['position' => 'ASC', 'id' => 'ASC'])]
    private Collection $items;

    public function __construct()
    {
        $this->items = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCard(): ?Card
    {
        return $this->card;
    }

    public function setCard(?Card $card): self
    {
        $this->card = $card;

        return $this;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function setTitle(string $title): self
    {
        $this->title = $title;

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

    /** @return Collection<int, ChecklistItem> */
    public function getItems(): Collection
    {
        return $this->items;
    }

    public function addItem(ChecklistItem $item): self
    {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setChecklist($this);
        }

        return $this;
    }

    public function removeItem(ChecklistItem $item): self
    {
        if ($this->items->removeElement($item)) {
            if ($item->getChecklist() === $this) {
                $item->setChecklist(null);
            }
        }

        return $this;
    }
}
