import type { ITransferCounterparty } from '@inccom/entities/transaction/model/types';

/** Суффикс контрагента: свой счёт — тип, чужой — имя владельца. */
export function formatTransferCounterpartySuffix(
	counterparty: ITransferCounterparty,
	currentUserId?: number,
	findTypeLabel?: (type: string) => string,
): string {
	const isOwn =
		currentUserId != null &&
		counterparty.ownerId != null &&
		counterparty.ownerId === currentUserId;

	if (isOwn) {
		const typeCode = counterparty.accountType ?? '';
		const typeLabel = findTypeLabel?.(typeCode) || typeCode;
		return typeLabel || 'счёт';
	}

	return counterparty.ownerName?.trim() || 'чужой счёт';
}

export function formatTransferActionLabel(action: 'expense' | 'income'): string {
	return action === 'expense'
		? 'Перевод (списание)'
		: 'Перевод (зачисление)';
}

/** «→ счёт – тип/владелец» */
export function formatTransferCounterpartyLine(
	counterparty: ITransferCounterparty | null | undefined,
	currentUserId?: number,
	findTypeLabel?: (type: string) => string,
): string | null {
	if (!counterparty) {
		return null;
	}

	const arrow = counterparty.direction === 'to' ? '→' : '←';
	const suffix = formatTransferCounterpartySuffix(
		counterparty,
		currentUserId,
		findTypeLabel,
	);

	return `${arrow} ${counterparty.accountLabel} – ${suffix}`;
}
