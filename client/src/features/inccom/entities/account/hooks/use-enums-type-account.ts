export type SelectOption = { value: string; label: string };

/** Значения совпадают с IncCom\Enum\AccountType на backend */
const data: Record<string, string> = {
	debit: 'Дебетовый',
	credit: 'Кредитный',
	deposit: 'Депозит',
	saving: 'Накопительный',
	cash: 'Наличные',
	other: 'Другое',
};

function findLabelByCode(type: string): string {
	return data[type] || type;
}

const dataSelect: SelectOption[] = Object.entries(data).map(([value, label]) => ({
	value,
	label,
}));

export function useEnumsTypeAccount() {
	return { isLoading: false, data, findLabelByCode, dataSelect };
}
