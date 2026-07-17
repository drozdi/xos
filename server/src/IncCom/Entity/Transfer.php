<?php

namespace IncCom\Entity;

use Main\Entity\User;
use IncCom\Repository\TransferRepository;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransferRepository::class)]
#[ORM\Table(name: 'inccom_transfer')]
#[ORM\HasLifecycleCallbacks]
class Transfer
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: "x_timestamp", type: Types::DATETIME_MUTABLE, nullable: true), ORM\Version]
    private ?\DateTimeInterface $xTimestamp = null;

    #[ORM\Column(name: 'amount', type: Types::DECIMAL, precision: 16, scale: 2)]
    private string $amount = '0.00';

    #[ORM\Column(name: 'date', type: Types::DATETIME_MUTABLE)]
    private \DateTimeInterface $date;

    #[ORM\Column(name: 'comment', type: Types::TEXT, nullable: true)]
    private ?string $comment = null;

    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'from_account_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private Account $fromAccount;

    #[ORM\ManyToOne(targetEntity: Account::class)]
    #[ORM\JoinColumn(name: 'to_account_id', referencedColumnName: 'id', nullable: false, onDelete: 'RESTRICT')]
    private Account $toAccount;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'author_id', referencedColumnName: 'id', nullable: true, onDelete: 'SET NULL')]
    private ?User $author = null;

    #[ORM\OneToOne(targetEntity: Transaction::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'outgoing_transaction_id', referencedColumnName: 'id', nullable: true, unique: true, onDelete: 'SET NULL')]
    private ?Transaction $outgoingTransaction = null;

    #[ORM\OneToOne(targetEntity: Transaction::class, cascade: ['persist'])]
    #[ORM\JoinColumn(name: 'incoming_transaction_id', referencedColumnName: 'id', nullable: true, unique: true, onDelete: 'SET NULL')]
    private ?Transaction $incomingTransaction = null;

    #[ORM\Column(name: 'created_at', type: Types::DATETIME_MUTABLE, nullable: true)]
    private ?\DateTimeInterface $createdAt = null;

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

    public function getAmount(): string {
        return $this->amount;
    }
    public function setAmount(string|int|float $amount): self {
        $this->amount = (string) $amount;
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

    public function getComment(): ?string {
        return $this->comment;
    }
    public function setComment(?string $comment): self {
        $this->comment = $comment;
        return $this;
    }

    public function getFromAccount(): Account {
        return $this->fromAccount;
    }
    public function setFromAccount(Account $fromAccount): self {
        $this->fromAccount = $fromAccount;
        return $this;
    }

    public function getToAccount(): Account {
        return $this->toAccount;
    }
    public function setToAccount(Account $toAccount): self {
        $this->toAccount = $toAccount;
        return $this;
    }

    public function getAuthor(): ?User {
        return $this->author;
    }
    public function setAuthor(?User $author): self {
        $this->author = $author;
        return $this;
    }

    public function getOutgoingTransaction(): ?Transaction {
        return $this->outgoingTransaction;
    }
    public function setOutgoingTransaction(?Transaction $outgoingTransaction): self {
        $this->outgoingTransaction = $outgoingTransaction;
        return $this;
    }

    public function getIncomingTransaction(): ?Transaction {
        return $this->incomingTransaction;
    }
    public function setIncomingTransaction(?Transaction $incomingTransaction): self {
        $this->incomingTransaction = $incomingTransaction;
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
}
