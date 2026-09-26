import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { canAccessApp, isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

function canAssetsScope(scopePath: string, actionScope: string): boolean {
	if (!canAccessApp('assets')) {
		return false;
	}
	if (isRoot() || isAppRoot('assets') || isScopeRoot(scopePath)) {
		return true;
	}

	return Boolean(getLevelScope(scopePath) & getCanScope(actionScope));
}

function useAssetsAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles, check]);
}

export function createAssetsCrudAccess(scopePath: string) {
	const can = (action: string) => canAssetsScope(scopePath, `${action}.${scopePath}`);

	return {
		canRead: () => can('can_read'),
		canCreate: () => can('can_create'),
		canUpdate: () => can('can_update'),
		canDelete: () => can('can_delete'),
		useCanRead: () => useAssetsAccess(() => can('can_read')),
		useCanCreate: () => useAssetsAccess(() => can('can_create')),
		useCanUpdate: () => useAssetsAccess(() => can('can_update')),
		useCanDelete: () => useAssetsAccess(() => can('can_delete')),
	};
}

export const warehouseAccess = createAssetsCrudAccess('assets.warehouse');
export const fleetAccess = createAssetsCrudAccess('assets.fleet');
export const partyAccess = createAssetsCrudAccess('assets.party');
export const contractAccess = createAssetsCrudAccess('assets.contract');
export const roomAccess = createAssetsCrudAccess('assets.room');
export const softwareAccess = createAssetsCrudAccess('assets.software');
