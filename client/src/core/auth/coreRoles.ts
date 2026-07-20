export const CORE_ROLES = {
	ROOT: 'ROLE_ROOT',
	ADMIN: 'ROLE_ADMIN',
	USER: 'ROLE_USER',
} as const;

export type CoreRole = (typeof CORE_ROLES)[keyof typeof CORE_ROLES];

let userRoles: string[] = [];

export function setUserRoles(roles: string[]): void {
	userRoles = [...roles];
}

export function resetUserRoles(): void {
	userRoles = [];
}

export function getUserRoles(): string[] {
	return userRoles;
}

/** Префикс роли приложения без ROLE_: main → MAIN */
export function toRolePrefix(rolePrefix: string): string {
	let normalized = rolePrefix.trim().toUpperCase();
	if (normalized.startsWith('ROLE_')) {
		normalized = normalized.slice(5);
	}
	return normalized;
}

export function normalizeRole(role: string): string {
	let normalized = role.trim().toUpperCase();
	if (!normalized.startsWith('ROLE_')) {
		normalized = `ROLE_${normalized}`;
	}
	return normalized;
}

export function isRole(role: string): boolean {
	return userRoles.includes(normalizeRole(role));
}

export function isRoot(): boolean {
	return isRole('root');
}

/** ROLE_{mod}_ADMIN */
export function isAdmin(mod = ''): boolean {
	const prefix = mod ? `${toRolePrefix(mod)}_` : '';
	return isRole(`${prefix}ADMIN`);
}

/** ROLE_{mod}_ROOT */
export function isAppRoot(mod: string): boolean {
	return isRole(`${toRolePrefix(mod)}_ROOT`);
}

/** main.ou → MAIN_OU */
export function scopePathToRolePrefix(scopePath: string): string {
	return scopePath.trim().toUpperCase().replace(/\./g, '_');
}

/** ROLE_{scope}_ROOT, например main.ou → ROLE_MAIN_OU_ROOT */
export function isScopeRoot(scopePath: string): boolean {
	return isRole(`${scopePathToRolePrefix(scopePath)}_ROOT`);
}

export function hasRole(roles: string[], role: CoreRole): boolean {
	return roles.includes(role);
}

/**
 * Доступ к приложению в пуске и при запуске:
 * ROLE_ROOT, ROLE_{name}, ROLE_{name}_ROOT или ROLE_{name}_ADMIN.
 */
export function canAccessApp(rolePrefix: string): boolean {
	if (isRoot()) {
		return true;
	}

	const prefix = toRolePrefix(rolePrefix);
	return (
		isRole(prefix) ||
		isRole(`${prefix}_ROOT`) ||
		isRole(`${prefix}_ADMIN`)
	);
}

/**
 * Полный доступ внутри приложения (scope не ограничивает):
 * ROLE_ROOT, ROLE_{name}_ROOT.
 */
export function hasFullAppAccess(rolePrefix: string): boolean {
	if (isRoot()) {
		return true;
	}

	const prefix = toRolePrefix(rolePrefix);
	return isRole(`${prefix}_ROOT`);
}
