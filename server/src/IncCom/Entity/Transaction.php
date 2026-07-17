<?php

namespace IncCom\Entity;

use Main\Entity\User;
use IncCom\Enum\TransactionType;
use IncCom\Repository\TransactionRepository;

use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransactionRepository::class)]
#[ORM\Table(name: 'inccom_transaction')]
#[ORM\HasLifecycleCallbacks]
class Transaction
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: "account_id", referencedColumnName: 'id')]
    private Account $account;

    #[ORM\ManyToOne(targetEntity: Category::class)]
    #[ORM\JoinColumn(name: "category_id", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?Category $category = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: "owner_id", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?User $author = null;

    #[ORM\Column(name: 'type', type: 'string', enumType: TransactionType::class)]
    private TransactionType $type;

    #[ORM\ManyToOne(targetEntity: Transfer::class)]
    #[ORM\JoinColumn(name: "transfer_id", referencedColumnName: 'id', nullable: true, onDelete: "SET NULL")]
    private ?Transfer $transfer = null;

    #[ORM\Column(name: 'date', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $date;

    #[ORM\Column(name: 'amount', type: Types::DECIMAL, precision: 16, scale: 2, options: ["default" => '0.00'])]
    private string $amount = '0.00';

    #[ORM\Column(name: 'comment', type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\Column(name: 'mcc', length: 10, nullable: true)]
    private ?string $mcc = null;

    #[ORM\Column(name: 'fn', length: 20, nullable: true)]
    private ?string $fn = null;

    #[ORM\Column(name: 'fpd', length: 20, nullable: true)]
    private ?string $fpd = null;

    #[ORM\Column(name: 'fp', length: 20, nullable: true)]
    private ?string $fp = null;

    #[ORM\Column(name: 'fd', length: 20, nullable: true)]
    private ?string $fd = null;

    #[ORM\Column(name: 'is_manual_amount', type: Types::BOOLEAN, options: ["default" => false])]
    private bool $isManualAmount = false;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\OneToMany(mappedBy: 'transaction', targetEntity: TransactionItem::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    private Collection $items;

    public function __construct() {
        $this->items = new ArrayCollection();
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
    public function getAccount(): Account {
        return $this->account;
    }
    public function setAccount(Account $account): self {
        $this->account = $account;
        return $this;
    }
    public function getCategory(): ?Category {
        return $this->category;
    }
    public function setCategory(?Category $category): self {
        $this->category = $category;
        return $this;
    }

    public function getAuthor(): ?User {
        return $this->author;
    }
    public function setAuthor(?User $author): self {
        $this->author = $author;
        return $this;
    }

    /**
     * @deprecated Use getAuthor() instead.
     */
    public function getOwner(): ?User {
        return $this->getAuthor();
    }

    /**
     * @deprecated Use setAuthor() instead.
     */
    public function setOwner(?User $owner): self {
        return $this->setAuthor($owner);
    }

    public function getTransfer(): ?Transfer {
        return $this->transfer;
    }
    public function setTransfer(?Transfer $transfer): self {
        $this->transfer = $transfer;
        return $this;
    }

    public function getDate(?string $format = null): \DateTimeInterface|string|null {
        if (null != $format && null != $this->date) {
            return $this->date->format($format);
        }
        return $this->date;
    }
    public function setDate(\DateTimeInterface $date): self {
        $this->date = $date;
        return $this;
    }

    public function getAmount(): string {
        return $this->amount;
    }
    public function setAmount(string|int|float $amount): self {
        $this->amount = (string) $amount;
        return $this;
    }
    public function getComment(): ?string {
        return $this->comment;
    }
    public function setComment(?string $comment): self {
        $this->comment = $comment;
        return $this;
    }

    public function getType(): TransactionType {
        return $this->type;
    }
    public function setType(TransactionType $type): self {
        $this->type = $type;
        return $this;
    }

    public function getMcc(): ?string {
        return $this->mcc;
    }
    public function setMcc(?string $mcc): self {
        $this->mcc = $mcc;
        return $this;
    }

    public function getFn(): ?string {
        return $this->fn;
    }
    public function setFn(?string $fn = null): self {
        $this->fn = $fn;
        return $this;
    }

    public function getFpd(): ?string {
        return $this->fpd;
    }
    public function setFpd(?string $fpd = null): self {
        $this->fpd = $fpd;
        return $this;
    }

    public function getFd(): ?string {
        return $this->fd;
    }
    public function setFd(?string $fd = null): self {
        $this->fd = $fd;
        return $this;
    }

    public function getFp(): ?string {
        return $this->fp;
    }
    public function setFp(?string $fp = null): self {
        $this->fp = $fp;
        return $this;
    }

    public function isManualAmount(): bool {
        return $this->isManualAmount;
    }
    public function setIsManualAmount(bool $isManualAmount): self {
        $this->isManualAmount = $isManualAmount;
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
     * @return Collection<int, TransactionItem>
     */
    public function getItems(): Collection {
        return $this->items;
    }

    public function addItem(TransactionItem $item): self {
        if (!$this->items->contains($item)) {
            $this->items->add($item);
            $item->setTransaction($this);
        }
        return $this;
    }

    public function removeItem(TransactionItem $item): self {
        $this->items->removeElement($item);
        return $this;
    }
}
