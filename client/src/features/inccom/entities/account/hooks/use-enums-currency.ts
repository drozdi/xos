import { type ComboboxItem } from '@mantine/core';

const data: Record<string, string> = {
	RUB: 'Российский рубль (RUB)',
	USD: 'Доллар США (USD)',
	EUR: 'Евро (EUR)',
	CNY: 'Китайский юань (CNY)',
	KZT: 'Казахстанский тенге (KZT)',
	BYN: 'Белорусский рубль (BYN)',
	UAH: 'Украинская гривна (UAH)',
};

function findLabelByCode(code: string): string {
	return data[code] || code;
}

const dataSelect: ComboboxItem[] = Object.entries(data).map(([value, label]) => ({
	value,
	label,
}));

export function useEnumsCurrency() {
	return { isLoading: false, data, findLabelByCode, dataSelect };
}
