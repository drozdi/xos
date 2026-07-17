<?php

namespace IncCom\DTO\Request;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Request body for POST /api/transfers.
 */
class CreateTransferRequest
{
    #[Assert\NotBlank(message: 'From account is required')]
    public mixed $fromAccountId = null;

    #[Assert\NotBlank(message: 'To account is required')]
    public mixed $toAccountId = null;

    #[Assert\NotBlank(message: 'Amount is required')]
    public mixed $amount = null;

    #[Assert\NotBlank(message: 'Date is required')]
    public ?string $date = null;
}
