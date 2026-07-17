import { type ComboboxItem } from '@mantine/core';

const data: Record<string, string> = {
	expense: 'Расход',
	income: 'Доход',
};
function findLabelByCode(type: string): string {
	return data[type] || type;
}
const dataSelect: ComboboxItem[] = [
	{
		label: 'Выберите тип',
		value: '',
		disabled: true,
	},
	...Object.entries(data).map(([value, label]) => ({
		value,
		label,
	})),
];

export function useEnumsTypeCategory() {
	return { isLoading: false, data, findLabelByCode, dataSelect };
}
