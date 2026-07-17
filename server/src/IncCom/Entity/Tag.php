<?php
namespace IncCom\Entity;

use Main\Entity\User;
use IncCom\Repository\TagRepository;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TagRepository::class)]
#[ORM\Table(name: 'inccom_tag')]
#[ORM\HasLifecycleCallbacks]
class Tag
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "owner_id", referencedColumnName: 'id', onDelete: "CASCADE")]
    private ?User $owner = null;

    #[ORM\Column(name: 'label', length: 255)]
    private string $label;

    #[ORM\Column(name: 'keywords', type: Types::TEXT, nullable: true)]
    private ?string $keywords = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $createdAt = null;

    public function __construct() {
        $this->children = new ArrayCollection();
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
        return $this->owner;
    }
    public function setUser(?User $user): self {
        $this->owner = $user;
        return $this;
    }

    /**
     * @deprecated Use getUser() instead.
     */
    public function getOwner(): ?User {
        return $this->getUser();
    }

    /**
     * @deprecated Use setUser() instead.
     */
    public function setOwner(?User $owner): self {
        return $this->setUser($owner);
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

    public function getKeywords(): ?string {
        return $this->keywords;
    }
    public function setKeywords(?string $keywords): self {
        $this->keywords = $keywords;
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
            $this->setUser($this->parent->getUser());
        }
        return $this;
    }
    public function addChild(self $child): self {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
            if ($this->getUser()) {
                $child->setUser($this->getUser());
            }
        }
        return $this;
    }
    public function removeChild(self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }
        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getChildren(): Collection {
        return $this->children;
    }
}
