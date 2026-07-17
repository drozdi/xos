<?php

namespace IncCom\Enum;

enum AccountType: string
{
    case Debit = 'debit';
    case Credit = 'credit';
    case Deposit = 'deposit';
    case Saving = 'saving';
    case Cash = 'cash';
    case Other = 'other';

    /**
     * @return string[]
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
