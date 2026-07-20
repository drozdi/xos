import type { GroupAccessItem, GroupDetail, GroupUserItem } from '@/core/api/endpoints/mainApi';

export {
	CAN_SCOPE_LABELS,
	checkedToLevel,
	extractCanScopeMap,
	getAccessLevel as getGroupAccessLevel,
	levelToChecked,
	resolveClaimantAccessMap,
	updateAccessLevel as updateGroupAccessLevel,
} from '@/features/main/accessRulesUtils';

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
