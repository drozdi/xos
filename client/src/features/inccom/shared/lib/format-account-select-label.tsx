import type { IAccount } from '@inccom/entities/account/model/types';
import { formatBalance } from '@inccom/shared/utils/number-format';
import {
	Box,
	Group,
	type ComboboxItem,
	type ComboboxLikeRenderOptionInput,
} from '@mantine/core';

/** Свой: «название (сумма) – тип»; чужой: «название (сумма) – владелец». */
export function formatAccountSelectLabel(
	account: IAccount,
	findTypeLabel: (type: string) => string,
): string {
	const base = `${account.label} (${formatBalance(account.balance)})`;

	if (account.isMaster === false && account.owner) {
		return `${base} – ${account.owner}`;
	}

	const typeLabel = findTypeLabel(account.type) || account.type;
	return `${base} – ${typeLabel}`;
}

export interface AccountSelectOption extends ComboboxItem {
	color?: string;
}

export function buildAccountSelectOptions(
	accounts: IAccount[],
	findTypeLabel: (type: string) => string,
): AccountSelectOption[] {
	return accounts.map((account) => ({
		value: String(account.id),
		label: formatAccountSelectLabel(account, findTypeLabel),
		color: account.color || undefined,
	}));
}

export function AccountColorDot({
	color,
	size = 10,
}: {
	color?: string | null;
	size?: number;
}) {
	if (!color) {
		return null;
	}

	return (
		<Box
			component="span"
			style={{
				width: size,
				height: size,
				borderRadius: '50%',
				backgroundColor: color,
				flexShrink: 0,
				display: 'inline-block',
			}}
		/>
	);
}

export function renderAccountSelectOption({
	option,
}: ComboboxLikeRenderOptionInput<AccountSelectOption>) {
	return (
		<Group gap="xs" wrap="nowrap">
			<AccountColorDot color={option.color} />
			<span>{option.label}</span>
		</Group>
	);
}

export function getAccountOptionColor(
	options: AccountSelectOption[],
	value: string | null | undefined,
): string | undefined {
	if (!value) {
		return undefined;
	}
	return options.find((option) => option.value === value)?.color;
}
