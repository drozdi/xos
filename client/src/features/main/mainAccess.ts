import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

const MAIN_OU_SCOPE = 'main.ou';
const READ_MAIN_OU_SCOPE = 'can_read.main.ou';
const CREATE_MAIN_OU_SCOPE = 'can_create.main.ou';
const UPDATE_MAIN_OU_SCOPE = 'can_update.main.ou';
const DELETE_MAIN_OU_SCOPE = 'can_delete.main.ou';

function canMainOu(actionScope: string): boolean {
	if (isRoot() || isAppRoot('main') || isScopeRoot(MAIN_OU_SCOPE)) {
		return true;
	}

	return Boolean(getLevelScope(MAIN_OU_SCOPE) & getCanScope(actionScope));
}

export function canReadMainOu(): boolean {
	return canMainOu(READ_MAIN_OU_SCOPE);
}

export function canCreateMainOu(): boolean {
	return canMainOu(CREATE_MAIN_OU_SCOPE);
}

export function canUpdateMainOu(): boolean {
	return canMainOu(UPDATE_MAIN_OU_SCOPE);
}

export function canDeleteMainOu(): boolean {
	return canMainOu(DELETE_MAIN_OU_SCOPE);
}

function useMainOuAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles]);
}

export function useCanReadMainOu(): boolean {
	return useMainOuAccess(canReadMainOu);
}

export function useCanCreateMainOu(): boolean {
	return useMainOuAccess(canCreateMainOu);
}

export function useCanUpdateMainOu(): boolean {
	return useMainOuAccess(canUpdateMainOu);
}

export function useCanDeleteMainOu(): boolean {
	return useMainOuAccess(canDeleteMainOu);
}
