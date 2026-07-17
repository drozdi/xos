<?php

namespace IncCom\Entity;

use Main\Entity\User;
use IncCom\Entity\Category;
use IncCom\Repository\AccountRepository;


use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AccountRepository::class)]
#[ORM\Table(name: 'inccom_account')]
#[ORM\HasLifecycleCallbacks]
class Account
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "owner_id", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $owner = null;

    #[ORM\ManyToMany(targetEntity: User::class)]
    #[ORM\JoinTable(name: 'inccom_account_user')]
    private Collection $users;

    #[ORM\OneToMany(mappedBy: 'account', targetEntity: Category::class)]
    private Collection $categories;

    #[ORM\Column(name: 'sort', type: Types::INTEGER, options: ["default" => 100])]
    private int $sort = 100;

    #[ORM\Column(name: 'label', length: 255)]
    private string $label;

    #[ORM\Column(name: 'description', type: Types::TEXT, nullable: true)]
    private ?string $description = null;

    #[ORM\Column(name: 'currency', length: 3, options: ["default" => 'RUB'])]
    private string $currency = 'RUB';

    #[ORM\Column(name: 'number', length: 255, nullable: true)]
    private ?string $number = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\Column(name: 'balance', type: Types::DECIMAL, precision: 16, scale: 2, options: ["default" => '0.00'])]
    private string $balance = '0.00';

    #[ORM\Column(name: 'type', type: 'string')]
    private string $type;

    #[ORM\Column(name: 'icon', type: 'string')]
    private string $icon;

    #[ORM\Column(name: 'color', type: 'string')]
    private string $color;

    public function __construct() {
        $this->categories = new ArrayCollection();
        $this->users = new ArrayCollection();
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

    public function getMaster(): ?User {
        return $this->owner;
    }
    public function setMaster(?User $master): self {
        $this->owner = $master;
        return $this;
    }

    /**
     * @deprecated Use getMaster() instead.
     */
    public function getOwner(): ?User {
        return $this->getMaster();
    }

    /**
     * @deprecated Use setMaster() instead.
     */
    public function setOwner(?User $owner): self {
        return $this->setMaster($owner);
    }

    /**
     * @return Collection<int, User>
     */
    public function getUsers(): Collection {
        return $this->users;
    }

    public function addUser(User $user): self {
        if (!$this->users->contains($user)) {
            $this->users->add($user);
        }
        return $this;
    }

    public function removeUser(User $user): self {
        $this->users->removeElement($user);
        return $this;
    }

    public function getDescription(): ?string {
        return $this->description;
    }
    public function setDescription(?string $description): self {
        $this->description = $description;
        return $this;
    }

    public function getCurrency(): string {
        return $this->currency;
    }
    public function setCurrency(string $currency): self {
        $this->currency = $currency;
        return $this;
    }

    public function getNumber(): ?string {
        return $this->number;
    }
    public function setNumber(?string $number): self {
        $this->number = $number;
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

    public function getSort(): ?int {
        return $this->sort;
    }
    public function setSort(int $sort): self {
        $this->sort = $sort;
        return $this;
    }
    public function getBalance(): ?string {
        return $this->balance;
    }
    public function setBalance(string|int|float $balance): self {
        $this->balance = (string) $balance;
        return $this;
    }
    public function getLabel(): ?string {
        return $this->label;
    }
    public function setLabel(string $label): self {
        $this->label = $label;
        return $this;
    }

    public function addCategory (Category $category): self {
        if (!$this->categories->contains($category)) {
            $this->categories->add($category);
            $category->setAccount($this);
        }
        return $this;
    }
    public function removeCategory (Category $category): self {
        if ($this->categories->removeElement($category)) {
            if ($category->getAccount() === $this) {
                $category->setAccount(null);
            }
        }
        return $this;
    }
    public function newCategory (?string $label): Category {
        $category = new Category();
        if (null!==$label) {
            $category->setLabel($label);
        }
        $this->addCategory($category);
        return $category;
    }
    /**
     * @return Collection<int, Category>
     */
    public function getCategories () {
        return $this->categories;
    }

    public function getType(): string {
        return $this->type;
    }
    public function setType(string $type): self {
        $this->type = $type;
        return $this;
    }

    public function getIcon(): string {
        return $this->icon;
    }
    public function setIcon(string $icon): self {
        $this->icon = $icon;
        return $this;
    }

    public function getColor(): string {
        return $this->color;
    }
    public function setColor(string $color): self {
        $this->color = $color;
        return $this;
    }
}
