<?php

namespace IncCom\Enum;

enum TransactionType: string
{
    case Income = 'income';
    case Expense = 'expense';

    /**
     * @return string[]
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
