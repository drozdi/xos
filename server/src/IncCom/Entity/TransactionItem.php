<?php

namespace IncCom\Entity;

use IncCom\Repository\TransactionItemRepository;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransactionItemRepository::class)]
#[ORM\Table(name: 'inccom_transaction_item')]
#[ORM\HasLifecycleCallbacks]
class TransactionItem
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\ManyToOne(targetEntity: Transaction::class, inversedBy: 'items')]
    #[ORM\JoinColumn(name: 'transaction_id', referencedColumnName: 'id', nullable: false, onDelete: 'CASCADE')]
    private Transaction $transaction;

    #[ORM\ManyToOne(targetEntity: Product::class)]
    #[ORM\JoinColumn(name: 'item_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private Product $item;

    #[ORM\Column(name: 'quantity', type: Types::DECIMAL, precision: 12, scale: 3)]
    private string $quantity = '0.000';

    #[ORM\Column(name: 'price', type: Types::DECIMAL, precision: 16, scale: 2)]
    private string $price = '0.00';

    #[ORM\Column(name: 'sum', type: Types::DECIMAL, precision: 16, scale: 2)]
    private string $sum = '0.00';

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $createdAt = null;

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        if ($this->createdAt === null) {
            $this->createdAt = new \DateTime();
        }
        $this->computeSum();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->computeSum();
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

    public function getTransaction(): Transaction {
        return $this->transaction;
    }
    public function setTransaction(Transaction $transaction): self {
        $this->transaction = $transaction;
        return $this;
    }

    public function getItem(): Product {
        return $this->item;
    }
    public function setItem(Product $item): self {
        $this->item = $item;
        return $this;
    }

    public function getQuantity(): string {
        return $this->quantity;
    }
    public function setQuantity(string|int|float $quantity): self {
        $this->quantity = (string) $quantity;
        return $this;
    }

    public function getPrice(): string {
        return $this->price;
    }
    public function setPrice(string|int|float $price): self {
        $this->price = (string) $price;
        return $this;
    }

    public function getSum(): string {
        return $this->sum;
    }
    public function setSum(string|int|float $sum): self {
        $this->sum = (string) $sum;
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

    public function computeSum(): self {
        $this->sum = bcmul($this->quantity, $this->price, 2);
        return $this;
    }
}
