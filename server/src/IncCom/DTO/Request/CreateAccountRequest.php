<?php

namespace IncCom\DTO\Request;

use IncCom\Enum\AccountType;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * Request body for POST /api/accounts.
 */
class CreateAccountRequest
{
    #[Assert\NotBlank(message: 'Label is required')]
    public ?string $label = null;

    #[Assert\NotBlank(message: 'Type is required')]
    #[Assert\Choice(
        callback: [AccountType::class, 'values'],
        message: 'Invalid account type',
    )]
    public ?string $type = null;

    #[Assert\NotBlank(message: 'Currency is required')]
    #[Assert\Length(exactly: 3, exactMessage: 'Currency must be exactly 3 characters')]
    public ?string $currency = 'RUB';

    public ?int $order = null;

    #[Assert\Type(type: 'numeric', message: 'Balance must be a number')]
    #[Assert\GreaterThanOrEqual(value: 0, message: 'Balance cannot be negative')]
    public int|float|string|null $balance = null;
}
