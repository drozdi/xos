import { type ComboboxItem } from '@mantine/core';
import { TbCards } from 'react-icons/tb';

const data: Record<string, typeof TbCards> = {
	cards: TbCards,
};
const dataSelect: ComboboxItem[] = Object.entries(data).map(([value]) => ({
	value,
	label: value,
}));

const findByCode = (code: string) => {
	return data[code] || code;
};

export function useEnumsIcons() {
	return {
		isLoading: false,
		dataSelect,
		findByCode,
	};
}
