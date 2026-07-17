<?php

namespace IncCom\DTO\Request;

use IncCom\Enum\TransactionType;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Request body for POST /api/transactions.
 */
#[Assert\Expression(
    expression: 'this.amount !== null and this.amount !== "" or (this.items !== null and this.items !== [])',
    message: 'Amount is required when no items are provided',
)]
class CreateTransactionRequest
{
    #[Assert\NotBlank(message: 'Type is required')]
    #[Assert\Choice(
        callback: [TransactionType::class, 'values'],
        message: 'Invalid transaction type',
    )]
    public ?string $type = null;

    #[Assert\NotBlank(message: 'Account is required')]
    public mixed $accountId = null;

    #[Assert\NotBlank(message: 'Date is required')]
    public ?string $date = null;

    public mixed $amount = null;

    /** @var array<int, array<string, mixed>>|null */
    public ?array $items = null;
}
