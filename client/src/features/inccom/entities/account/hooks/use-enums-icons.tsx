import { CreditCardOutlined } from '@ant-design/icons';

const data: Record<string, typeof CreditCardOutlined> = {
	cards: CreditCardOutlined,
};
const dataSelect = Object.entries(data).map(([value]) => ({
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
