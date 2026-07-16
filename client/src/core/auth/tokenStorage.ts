const ACCESS_TOKEN_KEY = 'xos.access_token';
const REFRESH_TOKEN_KEY = 'xos.refresh_token';

export function getAccessToken(): string | null {
	return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
	return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
	localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function setRefreshToken(token: string): void {
	localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function setTokens(accessToken: string, refreshToken: string): void {
	setAccessToken(accessToken);
	setRefreshToken(refreshToken);
}

export function clearTokens(): void {
	localStorage.removeItem(ACCESS_TOKEN_KEY);
	localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function hasAccessToken(): boolean {
	return getAccessToken() !== null;
}

export function hasRefreshToken(): boolean {
	return getRefreshToken() !== null;
}

export function hasStoredSession(): boolean {
	return hasAccessToken() || hasRefreshToken();
}
