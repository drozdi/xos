<?php

namespace Device\Entity;

use Device\Repository\AccountingRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\Common\Collections\Criteria;
use Doctrine\Common\Collections\Collection;
use Doctrine\Common\Collections\ArrayCollection;

#[ORM\Table(name: 'd_accounting')]
#[ORM\Entity(repositoryClass: AccountingRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Accounting {
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true)]
    #[ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_id', referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?self $parent = null;

    /**
     * One Accounting have Many Accountings.
     * @var Collection<int, Accounting>
     */
    #[ORM\OneToMany(mappedBy: 'parent', targetEntity: self::class)]
    private Collection $children;

    #[ORM\OneToOne(targetEntity: Device::class, mappedBy: "accounting")]
    /*#[ORM\JoinColumn(name: 'device_id', referencedColumnName: 'id', nullable: true, onDelete: "CASCADE")]*/
    private ?Device $device = null;

    #[ORM\Column(name: "date_created", type: Types::DATETIME_MUTABLE, nullable: false)]
    private \DateTimeInterface $dateCreated;

    #[ORM\Column(name: 'name', type: Types::TEXT, nullable: true)]
    private ?string $name = null;

    #[ORM\Column(name: "in_no", length: 255, nullable: true)]
    private ?string $inNo = null;

    #[ORM\Column(name: "invoice", length: 255, nullable: true)]
    private ?string $invoice = null;

    #[ORM\Column(name: "date_invoice", type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateInvoice = null;

    #[ORM\Column(name: "date_discarded", type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $dateDiscarded = null;

    #[ORM\Column(name: 'discarded', type: Types::BOOLEAN, options: ["default" => false])]
    private bool $discarded = false;

    /**
     * Constructor
     */
    public function __construct () {
        $this->children = new ArrayCollection();
        $this->dateCreated = new \DateTime();
    }

    public function getId (): ?int {
        return $this->id;
    }

    public function getXTimestamp (?string $format = null): \DateTimeInterface|string|null {
        if (null !== $format && null !== $this->xTimestamp) {
            return $this->xTimestamp->format($format);
        }
        return $this->xTimestamp;
    }
    public function setXTimestamp (\DateTimeInterface $xTimestamp): self {
        $this->xTimestamp = $xTimestamp;

        return $this;
    }

    public function getDateCreated (?string $format = null): \DateTimeInterface|string|null {
        if (null !== $format) {
            return $this->dateCreated->format($format);
        }
        return $this->dateCreated;
    }
    public function setDateCreated (\DateTimeInterface $dateCreated): self {
        $this->dateCreated = $dateCreated;

        return $this;
    }

    public function getDateInvoice (?string $format = null, bool $getParent = true): \DateTimeInterface|string|null {
        if ($getParent && null != $this->parent) {
            return $this->parent->getDateInvoice($format);
        }
        if (null != $format && null != $this->dateInvoice) {
            return $this->dateInvoice->format($format);
        }
        return $this->dateInvoice;
    }
    public function setDateInvoice (?\DateTimeInterface $dateInvoice = null): self {
        $this->dateInvoice = $dateInvoice;

        return $this;
    }

    public function getDateDiscarded (?string$format = null, bool $getParent = true): \DateTimeInterface|string|null {
        if ($getParent && null != $this->parent) {
            return $this->parent->getDateDiscarded($format);
        }
        if (null != $format && null != $this->dateDiscarded) {
            return $this->dateDiscarded->format($format);
        }
        return $this->dateDiscarded;
    }
    public function setDateDiscarded (?\DateTimeInterface $dateDiscarded = null): self {
        $this->dateDiscarded = $dateDiscarded;
        if (null != $dateDiscarded) {
            $this->setDiscarded(true);
        }
        foreach ($this->children as $child) {
            $child->setDateDiscarded($dateDiscarded);
        }
        return $this;
    }

    public function getParent (): ?self {
        return $this->parent;
    }
    public function setParent (?self $parent = null): self {
        if ($this->parent && ($this->parent !== $parent)) {
            $this->parent->removeChild($this);
        }

        $this->parent = $parent;

        if ($this->parent) {
            $this->parent->addChild($this);
        }

        return $this;
    }

    public function addChild (self $child): self {
        if (!$this->children->contains($child)) {
            $this->children->add($child);
            $child->setParent($this);
        }

        return $this;
    }
    public function removeChild (self $child): self {
        if ($this->children->removeElement($child)) {
            if ($child->getParent() === $this) {
                $child->setParent(null);
            }
        }
        return $this;
    }
    /**
     * Get children
     *
     * @return Collection<int, self>
     */
    public function getChildren (): Collection {
        return $this->children;
    }
    public function newChild (): self  {
        $child = new self;
        $child->setInNo($this->getInNo());
        $child->setName($this->getName());
        $child->setInvoice($this->getInvoice());
        $child->setDiscarded($this->isDiscarded());
        $child->setDateInvoice($this->getDateInvoice());
        $child->setDateDiscarded($this->getDateDiscarded());
        $this->addChild($child);
        return $child;
    }

    public function getDevice (): Device {
        return $this->device;
    }
    public function setDevice (Device $device = null): self {
        if ($this->device && ($this->device !== $device)) {
            $this->device->setAccounting(null);
        }
        $this->device = $device;
        if ($this->device && $this->device->getAccounting() != $this) {
            $this->device->setAccounting($this);
        }
        return $this;
    }

    public function getName (bool $getParent = true): ?string {
        if ($getParent && null != $this->parent) {
            return $this->parent->getName();
        }
        return $this->name;
    }
    public function setName (?string $name = null): self {
        $this->name = $name;
        return $this;
    }

    public function getInNo (bool $getParent = true): ?string {
        if ($getParent && null != $this->parent) {
            return $this->parent->getInNo();
        }
        return $this->inNo;
    }
    public function setInNo (?string $inNo = null): self {
        $this->inNo = $inNo;
        return $this;
    }

    public function isDiscarded (bool $getParent = true): bool {
        if ($getParent && null != $this->parent) {
            return $this->parent->isDiscarded();
        }
        return $this->discarded;
    }
    public function setDiscarded (bool $discarded): self {
        $this->discarded = $discarded;
        foreach ($this->children as $child) {
            $child->setDiscarded($discarded);
        }
        return $this;
    }

    public function getInvoice (bool $getParent = true): ?string {
        if ($getParent && null != $this->parent) {
            return $this->parent->getInvoice();
        }
        return $this->invoice;
    }
    public function setInvoice (?string $invoice = null): self {
        $this->invoice = $invoice;
        return $this;
    }

    public function isRoot (): bool {
        return null === $this->parent && $this->children->count() > 0;
    }
    public function isChild (): bool {
        return null !== $this->parent;
    }

    #[ORM\PrePersist]
    public function prePersist (): void {
        $this->setDateCreated(new \DateTime());
    }
    #[ORM\PreUpdate]
    public function preUpdate (): void {

    }
    #[ORM\PreFlush]
    public function preFlush (): void {

    }
    #[ORM\PreRemove]
    public function preRemove (): void {

    }
}

