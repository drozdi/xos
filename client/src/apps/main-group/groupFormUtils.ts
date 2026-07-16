import type { GroupAccessItem, GroupDetail, GroupUserItem } from '@/core/api/endpoints/mainApi';

export const CAN_SCOPE_LABELS: Record<string, string> = {
	can_create: 'Создание',
	can_read: 'Чтение',
	can_update: 'Изменение',
	can_delete: 'Удаление',
	can_access: 'Права',
	can_user: 'Пользователи',
	can_group: 'Группы',
	can_role: 'Роли',
};

export function extractCanScopeMap(source: Record<string, unknown>): Record<string, number> {
	const result: Record<string, number> = {};
	for (const [key, value] of Object.entries(source)) {
		if (key.startsWith('can_') && typeof value === 'number') {
			result[key] = value;
		}
	}
	return result;
}

export function resolveClaimantAccessMap(
	claimantCode: string,
	mainMapAccess: Record<string, unknown>,
): Record<string, number> {
	const parts = claimantCode.split('.');
	if (parts[0] !== 'main') {
		return {};
	}

	if (parts.length === 1) {
		return extractCanScopeMap(mainMapAccess);
	}

	let current: unknown = mainMapAccess;
	for (let index = 1; index < parts.length; index += 1) {
		const segment = parts[index];
		if (!segment || typeof current !== 'object' || current === null) {
			return {};
		}
		current = (current as Record<string, unknown>)[segment];
	}

	if (typeof current !== 'object' || current === null) {
		return {};
	}

	return extractCanScopeMap(current as Record<string, unknown>);
}

export function levelToChecked(level: number, scopeMap: Record<string, number>): Record<string, boolean> {
	const checked: Record<string, boolean> = {};
	for (const [key, bit] of Object.entries(scopeMap)) {
		checked[key] = (level & bit) === bit;
	}
	return checked;
}

export function checkedToLevel(checked: Record<string, boolean>, scopeMap: Record<string, number>): number {
	let level = 0;
	for (const [key, bit] of Object.entries(scopeMap)) {
		if (checked[key]) {
			level |= bit;
		}
	}
	return level;
}

export function normalizeGroupUsers(users: GroupDetail['users']): Record<string, GroupUserItem> {
	if (!users) {
		return {};
	}
	return { ...users };
}

export function prepareGroupSavePayload(data: GroupDetail): GroupDetail {
	return {
		...data,
		users: prepareGroupUsersPayload(data.users),
		accesses: prepareGroupAccessesPayload(data.accesses),
	};
}

function prepareGroupUsersPayload(users: GroupDetail['users']): Record<string, GroupUserItem> | undefined {
	if (!users) {
		return undefined;
	}

	const result: Record<string, GroupUserItem> = {};
	for (const [key, item] of Object.entries(users)) {
		const payload: GroupUserItem = {
			user_id: item.user_id,
			activeFrom: item.activeFrom ?? null,
			activeTo: item.activeTo ?? null,
		};
		if (item.id) {
			payload.id = item.id;
			result[String(item.id)] = payload;
			continue;
		}
		result[key.startsWith('new-') ? key : `new-${item.user_id}`] = payload;
	}
	return result;
}

function prepareGroupAccessesPayload(
	accesses: GroupDetail['accesses'],
): Record<string, GroupAccessItem> | undefined {
	if (!accesses) {
		return undefined;
	}

	const result: Record<string, GroupAccessItem> = {};
	for (const [key, item] of Object.entries(accesses)) {
		if (item.level <= 0) {
			continue;
		}
		const payload: GroupAccessItem = {
			claimant_id: item.claimant_id,
			level: item.level,
		};
		if (item.id) {
			payload.id = item.id;
			result[String(item.id)] = payload;
			continue;
		}
		result[key.startsWith('new-') ? key : `new-${item.claimant_id}`] = payload;
	}
	return result;
}

export function updateGroupUser(
	users: Record<string, GroupUserItem>,
	key: string,
	patch: Partial<GroupUserItem>,
): Record<string, GroupUserItem> {
	const current = users[key];
	if (!current) {
		return users;
	}
	return {
		...users,
		[key]: { ...current, ...patch },
	};
}

export function removeGroupUser(
	users: Record<string, GroupUserItem>,
	key: string,
): Record<string, GroupUserItem> {
	const next = { ...users };
	delete next[key];
	return next;
}

export function addGroupUser(
	users: Record<string, GroupUserItem>,
	userId: number,
	name: string,
): Record<string, GroupUserItem> {
	if (Object.values(users).some((item) => item.user_id === userId)) {
		return users;
	}
	return {
		...users,
		[`new-${userId}`]: {
			user_id: userId,
			name,
			activeFrom: null,
			activeTo: null,
		},
	};
}

export function updateGroupAccessLevel(
	accesses: Record<string, GroupAccessItem>,
	claimantId: number,
	claimantName: string,
	level: number,
): Record<string, GroupAccessItem> {
	const existingEntry = Object.entries(accesses).find(([, item]) => item.claimant_id === claimantId);
	if (level <= 0) {
		if (!existingEntry) {
			return accesses;
		}
		const next = { ...accesses };
		delete next[existingEntry[0]];
		return next;
	}

	const [existingKey, existingItem] = existingEntry ?? [];
	const key = existingKey ?? `new-${claimantId}`;
	return {
		...accesses,
		[key]: {
			id: existingItem?.id,
			claimant_id: claimantId,
			name: existingItem?.name ?? claimantName,
			level,
		},
	};
}

export function getGroupAccessLevel(
	accesses: Record<string, GroupAccessItem>,
	claimantId: number,
): number {
	return Object.values(accesses).find((item) => item.claimant_id === claimantId)?.level ?? 0;
}
