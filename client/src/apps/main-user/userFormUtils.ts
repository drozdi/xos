import type {
	GroupAccessItem,
	UserDetail,
	UserGroupItem,
} from '@/core/api/endpoints/mainApi';

export {
	CAN_SCOPE_LABELS,
	checkedToLevel,
	extractCanScopeMap,
	getAccessLevel as getUserAccessLevel,
	levelToChecked,
	resolveClaimantAccessMap,
	updateAccessLevel as updateUserAccessLevel,
} from '@/features/main/accessRulesUtils';

export function normalizeUserGroups(groups: UserDetail['groups']): Record<string, UserGroupItem> {
	if (!groups) {
		return {};
	}
	return { ...groups };
}

export function normalizeUserAccesses(
	accesses: UserDetail['accesses'],
): Record<string, GroupAccessItem> {
	if (!accesses) {
		return {};
	}
	return { ...accesses };
}

export function normalizeUserRoles(roles: UserDetail['roles']): string[] {
	return roles ?? [];
}

export function prepareUserSavePayload(data: UserDetail): UserDetail {
	return {
		...data,
		groups: prepareUserGroupsPayload(data.groups),
		accesses: prepareUserAccessesPayload(data.accesses),
		roles: normalizeUserRoles(data.roles),
	};
}

function prepareUserGroupsPayload(
	groups: UserDetail['groups'],
): Record<string, UserGroupItem> | undefined {
	if (!groups) {
		return undefined;
	}

	const result: Record<string, UserGroupItem> = {};
	for (const [key, item] of Object.entries(groups)) {
		const payload: UserGroupItem = {
			group_id: item.group_id,
			activeFrom: item.activeFrom ?? null,
			activeTo: item.activeTo ?? null,
		};
		if (item.id) {
			payload.id = item.id;
			result[String(item.id)] = payload;
			continue;
		}
		result[key.startsWith('new-') ? key : `new-${item.group_id}`] = payload;
	}
	return result;
}

function prepareUserAccessesPayload(
	accesses: UserDetail['accesses'],
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

export function updateUserGroup(
	groups: Record<string, UserGroupItem>,
	key: string,
	patch: Partial<UserGroupItem>,
): Record<string, UserGroupItem> {
	const current = groups[key];
	if (!current) {
		return groups;
	}
	return {
		...groups,
		[key]: { ...current, ...patch },
	};
}

export function removeUserGroup(
	groups: Record<string, UserGroupItem>,
	key: string,
): Record<string, UserGroupItem> {
	const next = { ...groups };
	delete next[key];
	return next;
}

export function addUserGroup(
	groups: Record<string, UserGroupItem>,
	groupId: number,
	name: string,
): Record<string, UserGroupItem> {
	if (Object.values(groups).some((item) => item.group_id === groupId)) {
		return groups;
	}
	return {
		...groups,
		[`new-${groupId}`]: {
			group_id: groupId,
			name,
			activeFrom: null,
			activeTo: null,
		},
	};
}

export function toggleUserRole(roles: string[], role: string): string[] {
	if (roles.includes(role)) {
		return roles.filter((item) => item !== role);
	}
	return [...roles, role];
}
