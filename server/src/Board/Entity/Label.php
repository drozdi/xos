<?php

namespace Board\Entity;

use Board\Repository\LabelRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: LabelRepository::class)]
#[ORM\Table(name: 'board_label')]
#[ORM\UniqueConstraint(name: 'uniq_board_label_board_name', columns: ['board_id', 'name'])]
class Label
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Board::class, inversedBy: 'labels')]
    #[ORM\JoinColumn(name: 'board_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Board $board = null;

    #[ORM\Column(length: 64)]
    private string $name = '';

    #[ORM\Column(length: 16)]
    private string $color = '#cccccc';

    /** @var Collection<int, Card> */
    #[ORM\ManyToMany(targetEntity: Card::class, mappedBy: 'labels')]
    private Collection $cards;

    public function __construct()
    {
        $this->cards = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getBoard(): ?Board
    {
        return $this->board;
    }

    public function setBoard(?Board $board): self
    {
        $this->board = $board;

        return $this;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): self
    {
        $this->name = $name;

        return $this;
    }

    public function getColor(): string
    {
        return $this->color;
    }

    public function setColor(string $color): self
    {
        $this->color = $color;

        return $this;
    }

    /** @return Collection<int, Card> */
    public function getCards(): Collection
    {
        return $this->cards;
    }
}
