export const currencyFormat = (amount: number | string = 0) => {
	return amount.toLocaleString('ru-RU', {
		style: 'currency',
		currency: 'RUB',
	});
};
