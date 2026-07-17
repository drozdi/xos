const balanceFormatOptions: Intl.NumberFormatOptions = {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
};

/** Формат баланса: тысячи через пробел, дробная часть через запятую (10 000,00) */
export function formatBalance(amount: number | string = 0): string {
	const value = typeof amount === 'string' ? Number(amount) : amount;
	if (Number.isNaN(value)) {
		return '0,00';
	}
	return value.toLocaleString('ru-RU', balanceFormatOptions);
}

export const numberFormat = formatBalance;

export const balanceInputProps = {
	thousandSeparator: ' ',
	decimalSeparator: ',',
	decimalScale: 2,
	fixedDecimalScale: false,
} as const;
