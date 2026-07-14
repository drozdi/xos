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

function normalizeRole(role: string): string {
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

export function isAdmin(mod = ''): boolean {
	const prefix = mod ? `${mod}_` : '';
	return isRole(`${prefix}admin`);
}

export function hasRole(roles: string[], role: CoreRole): boolean {
	return roles.includes(role);
}
