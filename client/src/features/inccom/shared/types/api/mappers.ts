import type { IAccount } from '@inccom/entities/account/model/types';
import type { ICategory } from '@inccom/entities/transaction-category/model/types';
import type { ApiAccount } from './account';
import type { ApiTransactionCategory } from './transaction-category';

export function mapAccountFromApi(data: ApiAccount): IAccount {
	return {
		id: data.id,
		x_timestamp: data.updatedAt ?? '',
		owner: data.owner ?? '',
		owner_id: data.ownerId ?? data.masterId ?? 0,
		sort: data.order ?? 0,
		label: data.label ?? data.name ?? '',
		balance: Number(data.balance ?? 0),
		type: data.type ?? '',
		color: data.color ?? '',
		icon: data.icon ?? '',
		currency: data.currency ?? 'RUB',
		isMaster: data.isMaster,
		participants: data.participants,
	};
}

export function mapAccountToApi(
	data: Partial<IAccount>,
): Record<string, unknown> {
	const mapped: Record<string, unknown> = {};
	if (data.label !== undefined) mapped['label'] = data.label;
	if (data.sort !== undefined) mapped['order'] = data.sort;
	for (const field of ['type', 'color', 'icon', 'balance', 'currency'] as const) {
		if (data[field] !== undefined) mapped[field] = data[field];
	}
	return mapped;
}

export function mapTransactionCategoryFromApi(
	data: ApiTransactionCategory,
): ICategory {
	return {
		id: data.id,
		x_timestamp: data.updatedAt ?? '',
		owner: '',
		owner_id: data.createdById ?? 0,
		account_id: data.accountId ?? 0,
		sort: data.order ?? 100,
		label: data.name,
		type: data.type ?? '',
		mcc: 0,
	};
}

export function mapTransactionCategoryToApi(
	data: Partial<ICategory>,
): Record<string, unknown> {
	const mapped: Record<string, unknown> = {};
	if (data.label !== undefined) mapped['name'] = data.label;
	if (data.sort !== undefined) mapped['order'] = data.sort;
	if (data.type !== undefined) mapped['type'] = data.type;
	return mapped;
}
