<?php

namespace IncCom\Entity;

use Main\Entity\User;
use IncCom\Repository\ProductRepository;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ProductRepository::class)]
#[ORM\Table(name: 'inccom_product')]
#[ORM\UniqueConstraint(name: 'uniq_item_user_name', columns: ['user_id', 'label'])]
#[ORM\HasLifecycleCallbacks]
class Product
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "user_id", referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]
    private ?User $user = null;

    #[ORM\Column(name: 'label', length: 255)]
    private string $label;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'unit', length: 50, nullable: true)]
    private ?string $unit = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\ManyToMany(targetEntity: Tag::class)]
    #[ORM\JoinTable(name: 'inccom_item_item_category')]
    #[ORM\JoinColumn(name: 'item_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    #[ORM\InverseJoinColumn(name: 'item_category_id', referencedColumnName: 'id', onDelete: 'CASCADE')]
    private Collection $itemCategories;

    public function __construct() {
        $this->itemCategories = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTime();
        }
    }

    public function getId(): ?int {
        return $this->id;
    }
    public function getXTimestamp(?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp(?\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;
        return $this;
    }

    public function getUser(): ?User {
        return $this->user;
    }
    public function setUser(?User $user): self {
        $this->user = $user;
        return $this;
    }

    public function getName(): string {
        return $this->label;
    }
    public function setName(string $name): self {
        $this->label = $name;
        return $this;
    }

    /**
     * @deprecated Use getName() instead.
     */
    public function getLabel(): string {
        return $this->getName();
    }

    /**
     * @deprecated Use setName() instead.
     */
    public function setLabel(string $label): self {
        return $this->setName($label);
    }

    public function getDescription(): ?string {
        return $this->description;
    }
    public function setDescription(?string $description): self {
        $this->description = $description;
        return $this;
    }

    public function getUnit(): ?string {
        return $this->unit;
    }
    public function setUnit(?string $unit): self {
        $this->unit = $unit;
        return $this;
    }

    public function getCreatedAt(?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->createdAt) {
            return $this->createdAt->format($format);
        }
        return $this->createdAt;
    }
    public function setCreatedAt(?\DateTimeInterface $createdAt): self {
        $this->createdAt = $createdAt;
        return $this;
    }

    /**
     * @return Collection<int, Tag>
     */
    public function getItemCategories(): Collection {
        return $this->itemCategories;
    }

    public function addItemCategory(Tag $tag): self {
        if (!$this->itemCategories->contains($tag)) {
            $this->itemCategories->add($tag);
        }
        return $this;
    }

    public function removeItemCategory(Tag $tag): self {
        $this->itemCategories->removeElement($tag);
        return $this;
    }
}
