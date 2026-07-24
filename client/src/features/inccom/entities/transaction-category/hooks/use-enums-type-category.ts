export type SelectOption = { value: string; label: string; disabled?: boolean };

const data: Record<string, string> = {
	expense: 'Расход',
	income: 'Доход',
	transfer: 'Перевод',
};
function findLabelByCode(type: string): string {
	return data[type] || type;
}
const dataSelect: SelectOption[] = [
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
