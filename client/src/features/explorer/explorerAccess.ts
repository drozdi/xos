import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { canAccessApp, isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

const EXPLORER_SCOPE = 'explorer';

function canExplorerScope(actionScope: string): boolean {
	const scopePath = EXPLORER_SCOPE;
	if (!canAccessApp('explorer')) {
		return false;
	}
	if (isRoot() || isAppRoot('explorer') || isScopeRoot(scopePath)) {
		return true;
	}

	return Boolean(getLevelScope(scopePath) & getCanScope(`${actionScope}.${scopePath}`));
}

function useExplorerAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles, check]);
}

export const canReadExplorer = () => canExplorerScope('can_read');
export const canWriteExplorer = () => canExplorerScope('can_write');
export const canDeleteExplorer = () => canExplorerScope('can_delete');

export const useCanReadExplorer = () => useExplorerAccess(canReadExplorer);
export const useCanWriteExplorer = () => useExplorerAccess(canWriteExplorer);
export const useCanDeleteExplorer = () => useExplorerAccess(canDeleteExplorer);

export const canArchiveExplorer = canWriteExplorer;
export const useCanArchiveExplorer = useCanWriteExplorer;
