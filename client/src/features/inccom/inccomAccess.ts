import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { canAccessApp, isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

const INCCOM_SCOPE = 'inccom';

function canInccomScope(actionScope: string): boolean {
	if (!canAccessApp('inccom')) {
		return false;
	}
	if (isRoot() || isAppRoot('inccom') || isScopeRoot(INCCOM_SCOPE)) {
		return true;
	}

	return Boolean(getLevelScope(INCCOM_SCOPE) & getCanScope(`${actionScope}.${INCCOM_SCOPE}`));
}

function useInccomAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles, check]);
}

export const canReadInccom = () => canInccomScope('can_read');
export const canWriteInccom = () => canInccomScope('can_write');

export const useCanReadInccom = () => useInccomAccess(canReadInccom);
export const useCanWriteInccom = () => useInccomAccess(canWriteInccom);
