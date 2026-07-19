import type { ITransferCounterparty } from '@inccom/entities/transaction/model/types';

export function formatTransferCounterparty(
	counterparty: ITransferCounterparty | null | undefined,
	currentUserId?: number,
): string | null {
	if (!counterparty) {
		return null;
	}

	const prefix = counterparty.direction === 'to' ? '→ ' : '← ';
	let text = `${prefix}${counterparty.accountLabel}`;

	if (
		currentUserId &&
		counterparty.ownerId &&
		counterparty.ownerId !== currentUserId &&
		counterparty.ownerName
	) {
		text += ` (${counterparty.ownerName})`;
	}

	return text;
}
