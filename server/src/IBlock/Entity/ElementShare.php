<?php

namespace IBlock\Entity;

use Doctrine\ORM\Mapping as ORM;
use IBlock\Repository\ElementShareRepository;
use Main\Entity\User;

#[ORM\Entity(repositoryClass: ElementShareRepository::class)]
#[ORM\Table(name: 'iblock_element_share')]
#[ORM\UniqueConstraint(name: 'UNIQ_IBLOCK_ELEMENT_SHARE', columns: ['element_id', 'user_id'])]
class ElementShare
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Element::class, inversedBy: 'shares')]
    #[ORM\JoinColumn(name: 'element_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?Element $element = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'user_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private ?User $user = null;

    public function getId(): ?int
    {
        return $this->id;
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

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): self
    {
        $this->user = $user;

        return $this;
    }
}
