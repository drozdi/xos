<?php

namespace IncCom\Service;

/**
 * Extracts line items from FNS getTicket JSON (various shapes).
 */
final class ReceiptJsonParser
{
    /**
     * @param array<string, mixed> $receipt
     *
     * @return list<array{name: string, quantity: string, price: string}>
     */
    public function extractItems(array $receipt): array
    {
        $rawItems = $this->locateItemsArray($receipt);
        $result = [];

        foreach ($rawItems as $row) {
            if (!is_array($row)) {
                continue;
            }
            $parsed = $this->parseRow($row);
            if (null !== $parsed) {
                $result[] = $parsed;
            }
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $receipt
     *
     * @return list<mixed>
     */
    private function locateItemsArray(array $receipt): array
    {
        $candidates = [
            $receipt['items'] ?? null,
            $receipt['content']['items'] ?? null,
            $receipt['ticket']['items'] ?? null,
            $receipt['ticket']['content']['items'] ?? null,
        ];

        foreach ($candidates as $candidate) {
            if (is_array($candidate) && array_is_list($candidate)) {
                return $candidate;
            }
        }

        return [];
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array{name: string, quantity: string, price: string}|null
     */
    private function parseRow(array $row): ?array
    {
        $name = trim((string) ($row['name'] ?? $row['productName'] ?? $row['title'] ?? $row['text'] ?? ''));
        if ('' === $name) {
            return null;
        }

        $quantity = $this->toDecimalQuantity($row['quantity'] ?? $row['qty'] ?? 1);
        if (bccomp($quantity, '0', 3) <= 0) {
            return null;
        }

        $sumRaw = $row['sum'] ?? $row['amount'] ?? null;
        $priceRaw = $row['price'] ?? null;

        if (null !== $sumRaw && '' !== $sumRaw) {
            $sum = $this->toMoney($sumRaw);
            $price = bccomp($quantity, '0', 3) === 0
                ? '0.00'
                : bcdiv($sum, $quantity, 2);
        } elseif (null !== $priceRaw && '' !== $priceRaw) {
            $price = $this->toMoney($priceRaw);
        } else {
            return null;
        }

        if (bccomp($price, '0', 2) < 0) {
            return null;
        }

        return [
            'name' => mb_substr($name, 0, 255),
            'quantity' => $quantity,
            'price' => $price,
        ];
    }

    private function toDecimalQuantity(mixed $value): string
    {
        if (is_string($value)) {
            $value = str_replace(',', '.', trim($value));
        }
        $num = (float) $value;
        if ($num <= 0) {
            return '0.000';
        }

        return number_format($num, 3, '.', '');
    }

    /**
     * FNS often sends kopecks as integers (e.g. 12550 = 125.50).
     */
    private function toMoney(mixed $value): string
    {
        if (is_string($value)) {
            $trimmed = str_replace(',', '.', trim($value));
            if (str_contains($trimmed, '.')) {
                return number_format((float) $trimmed, 2, '.', '');
            }
            if (ctype_digit(ltrim($trimmed, '-'))) {
                $int = (int) $trimmed;

                return number_format($int / 100, 2, '.', '');
            }

            return number_format((float) $trimmed, 2, '.', '');
        }

        if (is_int($value)) {
            return number_format($value / 100, 2, '.', '');
        }

        if (is_float($value)) {
            // Heuristic: large float without needing kopecks is rare; treat as rubles
            return number_format($value, 2, '.', '');
        }

        return '0.00';
    }
}
