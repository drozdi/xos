type ScopeMap = Record<string, unknown>;

let mapScopes: Record<string, ScopeMap> = {};
let levelScopes: Record<string, number> = {};
const cacheLevelScopes: Record<string, number> = {};

export function resetScopes(): void {
	mapScopes = {};
	levelScopes = {};
	Object.keys(cacheLevelScopes).forEach((key) => {
		delete cacheLevelScopes[key];
	});
}

export function setLevelScopes(scopes: Record<string, number>): void {
	levelScopes = { ...scopes };
	Object.keys(cacheLevelScopes).forEach((key) => {
		delete cacheLevelScopes[key];
	});
}

export function joinLevel(key: Record<string, number> | string, level = 0): void {
	if (typeof key === 'object') {
		Object.entries(key).forEach(([scopeKey, scopeLevel]) => {
			joinLevel(scopeKey, scopeLevel);
		});
		return;
	}

	levelScopes[key] = level | (levelScopes[key] ?? 0);
	Object.keys(cacheLevelScopes).forEach((cacheKey) => {
		delete cacheLevelScopes[cacheKey];
	});
}

export function joinScopes(app: string, map: ScopeMap): void {
	const flattened: ScopeMap = {};

	function enumeration(sub: ScopeMap): void {
		Object.entries(sub).forEach(([key, value]) => {
			if (key.startsWith('can_')) {
				flattened[key] = value;
			} else if (value && typeof value === 'object') {
				enumeration(value as ScopeMap);
			}
		});
	}

	enumeration(map);
	mapScopes[app] = flattened;
}

export function setMapScopes(map: Record<string, ScopeMap>): void {
	Object.entries(map).forEach(([app, scopeMap]) => {
		joinScopes(app, scopeMap);
	});
}

function resolveCanScope(scope: string): number {
	const parts = scope.split('.');
	const can = parts.shift();
	if (!can) {
		return 0;
	}

	let current: unknown = mapScopes;
	for (const part of parts) {
		if (!current || typeof current !== 'object') {
			return 0;
		}
		current = (current as ScopeMap)[part];
	}

	if (!current || typeof current !== 'object') {
		return 0;
	}

	const value = (current as ScopeMap)[can];
	return typeof value === 'number' ? value : 0;
}

export function getCanScope(scope: string): number {
	return resolveCanScope(scope);
}

export function getLevelScope(scope: string): number {
	const normalizedScope = scope.startsWith('can_') ? scope.slice(4) : scope;
	if (cacheLevelScopes[normalizedScope] !== undefined) {
		return cacheLevelScopes[normalizedScope] as number;
	}

	const parts = normalizedScope.split('.');
	let current = '';
	let level = 0;

	for (const part of parts) {
		current = current ? `${current}.${part}` : part;
		level |= levelScopes[current] ?? 0;
	}

	cacheLevelScopes[normalizedScope] = level;
	return level;
}

export function checkHasScope(scope: string): boolean {
	let not = false;
	let targetScope = scope;

	if (targetScope.startsWith('!')) {
		not = true;
		targetScope = targetScope.slice(1);
	}

	const result = Boolean(getLevelScope(targetScope) & getCanScope(targetScope));
	return not ? !result : result;
}

export const CORE_SCOPES = {
	READ: 'read',
	WRITE: 'write',
	DELETE: 'delete',
	MANAGE: 'manage',
} as const;

export type CoreScope = (typeof CORE_SCOPES)[keyof typeof CORE_SCOPES];

export function hasScope(scopes: string[], scope: CoreScope): boolean {
	return scopes.includes(scope);
}
