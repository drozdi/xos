import { refreshToken as refreshTokenRequest } from '@/core/api/endpoints/auth';

import * as tokenStorage from './tokenStorage';
import type { AuthRealm } from './tokenStorage';

export function isAccessTokenExpired(token: string, skewSeconds = 30): boolean {
	try {
		const payloadPart = token.split('.')[1];
		if (!payloadPart) {
			return true;
		}

		const payload = JSON.parse(
			atob(payloadPart.replace(/-/g, '+').replace(/_/g, '/')),
		) as { exp?: number };

		if (typeof payload.exp !== 'number') {
			return true;
		}

		return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
	} catch {
		return true;
	}
}

export async function restoreAccessToken(
	realm: AuthRealm = tokenStorage.resolveAuthRealm(),
): Promise<boolean> {
	const accessToken = tokenStorage.getAccessToken(realm);
	const refreshToken = tokenStorage.getRefreshToken(realm);

	if (accessToken && !isAccessTokenExpired(accessToken)) {
		return true;
	}

	if (!refreshToken) {
		return false;
	}

	try {
		const response = await refreshTokenRequest(refreshToken);
		tokenStorage.setTokens(response.token, response.refresh_token, realm);
		return true;
	} catch {
		return false;
	}
}
