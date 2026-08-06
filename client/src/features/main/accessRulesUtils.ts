import type {
	AccessOptions,
	GroupAccessItem,
} from '@/core/api/endpoints/mainApi';

/** Fallback titles when `access_options` empty / missing title (legacy). */
export const CAN_SCOPE_LABELS: Record<string, string> = {
	can_create: 'Создание',
	can_read: 'Чтение',
	can_update: 'Изменение',
	can_delete: 'Удаление',
	can_access: 'Права',
	can_user: 'Пользователи',
	can_group: 'Группы',
	can_role: 'Роли',
	can_write: 'Запись',
	can_mod: 'Модификация',
	can_location: 'Размещение',
	can_write_off: 'Списание',
	can_repair: 'Ремонт',
};

export type ModuleAccessMode = 'none' | 'available' | 'full';

export interface ClaimantRef {
	id: number;
	code: string;
	name: string;
	access_options?: AccessOptions;
}

export interface ModuleAccessGroup {
	module: string;
	moduleLabel: string;
	root?: ClaimantRef;
	children: ClaimantRef[];
}

export function normalizeCanBit(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
		return value;
	}
	if (typeof value === 'object' && value !== null && 'bit' in value) {
		const bit = (value as { bit: unknown }).bit;
		if (typeof bit === 'number' && Number.isFinite(bit) && bit > 0) {
			return bit;
		}
	}
	return null;
}

export function scopeMapFromAccessOptions(
	options: AccessOptions | undefined | null,
): Record<string, number> {
	if (!options) {
		return {};
	}
	const result: Record<string, number> = {};
	for (const [key, option] of Object.entries(options)) {
		if (!key.startsWith('can_')) {
			continue;
		}
		const bit = normalizeCanBit(option);
		if (bit !== null) {
			result[key] = bit;
		}
	}
	return result;
}

export function labelsFromAccessOptions(
	options: AccessOptions | undefined | null,
): Record<string, string> {
	if (!options) {
		return {};
	}
	const result: Record<string, string> = {};
	for (const [key, option] of Object.entries(options)) {
		if (!key.startsWith('can_')) {
			continue;
		}
		const title =
			typeof option?.title === 'string' && option.title.trim()
				? option.title
				: (CAN_SCOPE_LABELS[key] ?? key);
		result[key] = title;
	}
	return result;
}

/** Prefer claimant.access_options; legacy moduleMaps only if options empty. */
export function resolveClaimantScopeMap(
	claimant: ClaimantRef,
	legacyModuleMaps?: Record<string, Record<string, unknown>>,
): Record<string, number> {
	const fromOptions = scopeMapFromAccessOptions(claimant.access_options);
	if (Object.keys(fromOptions).length > 0) {
		return fromOptions;
	}
	if (legacyModuleMaps) {
		return resolveClaimantAccessMap(claimant.code, legacyModuleMaps);
	}
	return {};
}

export function resolveClaimantScopeLabels(
	claimant: ClaimantRef,
	scopeMap: Record<string, number>,
): Record<string, string> {
	const fromOptions = labelsFromAccessOptions(claimant.access_options);
	const result: Record<string, string> = {};
	for (const key of Object.keys(scopeMap)) {
		result[key] = fromOptions[key] ?? CAN_SCOPE_LABELS[key] ?? key;
	}
	return result;
}

export function extractCanScopeMap(source: Record<string, unknown>): Record<string, number> {
	const result: Record<string, number> = {};
	for (const [key, value] of Object.entries(source)) {
		if (!key.startsWith('can_')) {
			continue;
		}
		const bit = normalizeCanBit(value);
		if (bit !== null) {
			result[key] = bit;
		}
	}
	return result;
}

export function resolveClaimantAccessMap(
	claimantCode: string,
	allModuleMaps: Record<string, Record<string, unknown>>,
): Record<string, number> {
	const parts = claimantCode.split('.').filter(Boolean);
	if (parts.length === 0 || !parts[0]) {
		return {};
	}

	const moduleMap = allModuleMaps[parts[0]] ?? {};
	if (parts.length === 1) {
		return extractCanScopeMap(moduleMap as Record<string, unknown>);
	}

	let current: unknown = moduleMap;
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

export function getModuleScopeClaimants(
	moduleGroup: ModuleAccessGroup,
	legacyModuleMaps?: Record<string, Record<string, unknown>>,
): ClaimantRef[] {
	const withScopes = (claimant: ClaimantRef) =>
		Object.keys(resolveClaimantScopeMap(claimant, legacyModuleMaps)).length > 0;

	if (moduleGroup.children.length > 0) {
		return moduleGroup.children.filter(withScopes);
	}

	if (moduleGroup.root && withScopes(moduleGroup.root)) {
		return [moduleGroup.root];
	}

	return [];
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

export function groupClaimantsByModule(claimants: ClaimantRef[]): ModuleAccessGroup[] {
	const modules = new Map<string, ModuleAccessGroup>();

	for (const claimant of claimants) {
		const parts = claimant.code.split('.');
		const module = parts[0];
		if (!module) {
			continue;
		}

		if (!modules.has(module)) {
			modules.set(module, {
				module,
				moduleLabel: module,
				children: [],
			});
		}

		const entry = modules.get(module)!;
		if (parts.length === 1) {
			entry.root = claimant;
			entry.moduleLabel = claimant.name;
		} else {
			entry.children.push(claimant);
		}
	}

	return Array.from(modules.values()).sort((a, b) => a.moduleLabel.localeCompare(b.moduleLabel, 'ru'));
}

export function moduleRolePrefix(module: string): string {
	return module.trim().toUpperCase();
}

export function moduleAppRole(module: string): string {
	return `ROLE_${moduleRolePrefix(module)}`;
}

export function moduleRootRole(module: string): string {
	return `ROLE_${moduleRolePrefix(module)}_ROOT`;
}

export function getAccessLevel(
	accesses: Record<string, GroupAccessItem>,
	claimantId: number,
): number {
	return Object.values(accesses).find((item) => item.claimant_id === claimantId)?.level ?? 0;
}

export function updateAccessLevel(
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

export function getModuleAccessMode(
	module: string,
	roles: string[],
	accesses: Record<string, GroupAccessItem>,
	scopeClaimants: ClaimantRef[],
): ModuleAccessMode {
	if (roles.includes(moduleRootRole(module))) {
		return 'full';
	}

	if (roles.includes(moduleAppRole(module))) {
		return 'available';
	}

	const hasScopedAccess = scopeClaimants.some((child) => getAccessLevel(accesses, child.id) > 0);
	return hasScopedAccess ? 'available' : 'none';
}

export function applyModuleAccessMode(
	module: string,
	mode: ModuleAccessMode,
	roles: string[],
	accesses: Record<string, GroupAccessItem>,
	scopeClaimants: ClaimantRef[],
): { roles: string[]; accesses: Record<string, GroupAccessItem> } {
	const appRole = moduleAppRole(module);
	const rootRole = moduleRootRole(module);

	let nextRoles = roles.filter((role) => role !== appRole && role !== rootRole);
	if (mode === 'available') {
		nextRoles = [...nextRoles, appRole];
	} else if (mode === 'full') {
		nextRoles = [...nextRoles, rootRole];
	}

	let nextAccesses = { ...accesses };
	for (const child of scopeClaimants) {
		nextAccesses = updateAccessLevel(nextAccesses, child.id, child.name, 0);
	}

	return { roles: nextRoles, accesses: nextAccesses };
}

export function clearModuleAccesses(
	accesses: Record<string, GroupAccessItem>,
	scopeClaimants: ClaimantRef[],
): Record<string, GroupAccessItem> {
	let next = { ...accesses };
	for (const child of scopeClaimants) {
		next = updateAccessLevel(next, child.id, child.name, 0);
	}
	return next;
}
