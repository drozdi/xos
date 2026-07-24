import { formatBalance } from '@inccom/shared/utils/number-format';
import { Modal } from 'antd';

export interface ExpenseAmountItem {
	quantity: string;
	price: string;
}

export function calculateExpenseAmount(
	amount: number | string,
	isManualAmount: boolean,
	items: ExpenseAmountItem[],
): number {
	if (isManualAmount) {
		return roundMoney(Number(amount) || 0);
	}

	return roundMoney(
		items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.price), 0),
	);
}

export function getBalanceAfterDebit(
	currentBalance: number,
	debitAmount: number,
	previousDebitOnSameAccount = 0,
): number {
	return roundMoney(currentBalance - debitAmount + previousDebitOnSameAccount);
}

export function willBalanceGoNegative(
	currentBalance: number,
	debitAmount: number,
	previousDebitOnSameAccount = 0,
): boolean {
	return getBalanceAfterDebit(currentBalance, debitAmount, previousDebitOnSameAccount) < 0;
}

export function confirmNegativeBalance(params: {
	accountLabel: string;
	projectedBalance: number;
}): Promise<boolean> {
	return new Promise((resolve) => {
		Modal.confirm({
			title: 'Отрицательный баланс',
			centered: true,
			content: `Операция приведёт баланс счёта «${params.accountLabel}» к отрицательному значению (${formatBalance(params.projectedBalance)}). Продолжить?`,
			okText: 'Продолжить',
			cancelText: 'Отмена',
			okButtonProps: { danger: true },
			onOk: () => resolve(true),
			onCancel: () => resolve(false),
		});
	});
}

function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}
