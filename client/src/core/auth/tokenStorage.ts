const LEGACY_KEYS = [
	'xos.access_token',
	'xos.refresh_token',
	'xos.app.access_token',
	'xos.app.refresh_token',
];

export type AuthRealm = 'desktop' | 'app';
export type StandaloneAppId = 'inccom' | 'schooltask' | 'calendar';

const accessTokens = new Map<AuthRealm, string>();

if (typeof localStorage !== 'undefined') {
	for (const key of LEGACY_KEYS) {
		localStorage.removeItem(key);
	}
}

/** Standalone apps with email auth under their own path. */
export function resolveStandaloneApp(
	pathname = typeof window !== 'undefined' ? window.location.pathname : '',
): StandaloneAppId | null {
	if (pathname === '/inccom' || pathname.startsWith('/inccom/')) {
		return 'inccom';
	}
	if (pathname === '/schooltask' || pathname.startsWith('/schooltask/')) {
		return 'schooltask';
	}
	if (pathname === '/calendar' || pathname.startsWith('/calendar/')) {
		return 'calendar';
	}
	return null;
}

export function resolveAuthRealm(
	pathname = typeof window !== 'undefined' ? window.location.pathname : '',
): AuthRealm {
	return resolveStandaloneApp(pathname) ? 'app' : 'desktop';
}

export function getAccessToken(realm: AuthRealm = resolveAuthRealm()): string | null {
	return accessTokens.get(realm) ?? null;
}

export function getRefreshToken(_realm: AuthRealm = resolveAuthRealm()): string | null {
	return null;
}

export function setAccessToken(token: string, realm: AuthRealm = resolveAuthRealm()): void {
	accessTokens.set(realm, token);
}

export function setRefreshToken(_token: string, _realm: AuthRealm = resolveAuthRealm()): void {
	// Refresh lives in an HttpOnly cookie set by the API.
}

export function setTokens(
	accessToken: string,
	_refreshToken?: string,
	realm: AuthRealm = resolveAuthRealm(),
): void {
	setAccessToken(accessToken, realm);
}

export function clearTokens(realm: AuthRealm = resolveAuthRealm()): void {
	accessTokens.delete(realm);
}

export function hasAccessToken(realm: AuthRealm = resolveAuthRealm()): boolean {
	return getAccessToken(realm) !== null;
}

export function hasRefreshToken(_realm: AuthRealm = resolveAuthRealm()): boolean {
	return false;
}

export function hasStoredSession(realm: AuthRealm = resolveAuthRealm()): boolean {
	return hasAccessToken(realm);
}
