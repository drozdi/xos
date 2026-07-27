const ACCESS_TOKEN_KEY = 'xos.access_token';
const REFRESH_TOKEN_KEY = 'xos.refresh_token';
const APP_ACCESS_TOKEN_KEY = 'xos.app.access_token';
const APP_REFRESH_TOKEN_KEY = 'xos.app.refresh_token';

export type AuthRealm = 'desktop' | 'app';
export type StandaloneAppId = 'inccom' | 'schooltask';

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
	return null;
}

export function resolveAuthRealm(
	pathname = typeof window !== 'undefined' ? window.location.pathname : '',
): AuthRealm {
	return resolveStandaloneApp(pathname) ? 'app' : 'desktop';
}

function keysFor(realm: AuthRealm): { access: string; refresh: string } {
	if (realm === 'app') {
		return { access: APP_ACCESS_TOKEN_KEY, refresh: APP_REFRESH_TOKEN_KEY };
	}
	return { access: ACCESS_TOKEN_KEY, refresh: REFRESH_TOKEN_KEY };
}

export function getAccessToken(realm: AuthRealm = resolveAuthRealm()): string | null {
	return localStorage.getItem(keysFor(realm).access);
}

export function getRefreshToken(realm: AuthRealm = resolveAuthRealm()): string | null {
	return localStorage.getItem(keysFor(realm).refresh);
}

export function setAccessToken(token: string, realm: AuthRealm = resolveAuthRealm()): void {
	localStorage.setItem(keysFor(realm).access, token);
}

export function setRefreshToken(token: string, realm: AuthRealm = resolveAuthRealm()): void {
	localStorage.setItem(keysFor(realm).refresh, token);
}

export function setTokens(
	accessToken: string,
	refreshToken: string,
	realm: AuthRealm = resolveAuthRealm(),
): void {
	setAccessToken(accessToken, realm);
	setRefreshToken(refreshToken, realm);
}

export function clearTokens(realm: AuthRealm = resolveAuthRealm()): void {
	const keys = keysFor(realm);
	localStorage.removeItem(keys.access);
	localStorage.removeItem(keys.refresh);
}

export function hasAccessToken(realm: AuthRealm = resolveAuthRealm()): boolean {
	return getAccessToken(realm) !== null;
}

export function hasRefreshToken(realm: AuthRealm = resolveAuthRealm()): boolean {
	return getRefreshToken(realm) !== null;
}

export function hasStoredSession(realm: AuthRealm = resolveAuthRealm()): boolean {
	return hasAccessToken(realm) || hasRefreshToken(realm);
}
