import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { isAppRoot, isRoot, isScopeRoot, canAccessApp } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

const MAIN_OU_SCOPE = 'main.ou';
const READ_MAIN_OU_SCOPE = 'can_read.main.ou';
const CREATE_MAIN_OU_SCOPE = 'can_create.main.ou';
const UPDATE_MAIN_OU_SCOPE = 'can_update.main.ou';
const DELETE_MAIN_OU_SCOPE = 'can_delete.main.ou';

function canMainOu(actionScope: string): boolean {
	if (!canAccessApp('main')) {
		return false;
	}
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

const MAIN_CLAIMANT_SCOPE = 'main.claimant';
const READ_MAIN_CLAIMANT_SCOPE = 'can_read.main.claimant';
const CREATE_MAIN_CLAIMANT_SCOPE = 'can_create.main.claimant';
const UPDATE_MAIN_CLAIMANT_SCOPE = 'can_update.main.claimant';
const DELETE_MAIN_CLAIMANT_SCOPE = 'can_delete.main.claimant';

function canMainClaimant(actionScope: string): boolean {
	if (!canAccessApp('main')) {
		return false;
	}
	if (isRoot() || isAppRoot('main') || isScopeRoot(MAIN_CLAIMANT_SCOPE)) {
		return true;
	}

	return Boolean(getLevelScope(MAIN_CLAIMANT_SCOPE) & getCanScope(actionScope));
}

export function canReadMainClaimant(): boolean {
	return canMainClaimant(READ_MAIN_CLAIMANT_SCOPE);
}

export function canCreateMainClaimant(): boolean {
	return canMainClaimant(CREATE_MAIN_CLAIMANT_SCOPE);
}

export function canUpdateMainClaimant(): boolean {
	return canMainClaimant(UPDATE_MAIN_CLAIMANT_SCOPE);
}

export function canDeleteMainClaimant(): boolean {
	return canMainClaimant(DELETE_MAIN_CLAIMANT_SCOPE);
}

function useMainClaimantAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles]);
}

export function useCanReadMainClaimant(): boolean {
	return useMainClaimantAccess(canReadMainClaimant);
}

export function useCanCreateMainClaimant(): boolean {
	return useMainClaimantAccess(canCreateMainClaimant);
}

export function useCanUpdateMainClaimant(): boolean {
	return useMainClaimantAccess(canUpdateMainClaimant);
}

export function useCanDeleteMainClaimant(): boolean {
	return useMainClaimantAccess(canDeleteMainClaimant);
}

const MAIN_GROUP_SCOPE = 'main.group';
const READ_MAIN_GROUP_SCOPE = 'can_read.main.group';
const CREATE_MAIN_GROUP_SCOPE = 'can_create.main.group';
const UPDATE_MAIN_GROUP_SCOPE = 'can_update.main.group';
const DELETE_MAIN_GROUP_SCOPE = 'can_delete.main.group';
const USER_MAIN_GROUP_SCOPE = 'can_user.main.group';
const ACCESS_MAIN_GROUP_SCOPE = 'can_access.main.group';

function canMainGroup(actionScope: string): boolean {
	if (!canAccessApp('main')) {
		return false;
	}
	if (isRoot() || isAppRoot('main') || isScopeRoot(MAIN_GROUP_SCOPE)) {
		return true;
	}

	return Boolean(getLevelScope(MAIN_GROUP_SCOPE) & getCanScope(actionScope));
}

export function canReadMainGroup(): boolean {
	return canMainGroup(READ_MAIN_GROUP_SCOPE);
}

export function canCreateMainGroup(): boolean {
	return canMainGroup(CREATE_MAIN_GROUP_SCOPE);
}

export function canUpdateMainGroup(): boolean {
	return canMainGroup(UPDATE_MAIN_GROUP_SCOPE);
}

export function canDeleteMainGroup(): boolean {
	return canMainGroup(DELETE_MAIN_GROUP_SCOPE);
}

export function canUserMainGroup(): boolean {
	return canMainGroup(USER_MAIN_GROUP_SCOPE);
}

export function canAccessMainGroup(): boolean {
	return canMainGroup(ACCESS_MAIN_GROUP_SCOPE);
}

function useMainGroupAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles]);
}

export function useCanReadMainGroup(): boolean {
	return useMainGroupAccess(canReadMainGroup);
}

export function useCanCreateMainGroup(): boolean {
	return useMainGroupAccess(canCreateMainGroup);
}

export function useCanUpdateMainGroup(): boolean {
	return useMainGroupAccess(canUpdateMainGroup);
}

export function useCanDeleteMainGroup(): boolean {
	return useMainGroupAccess(canDeleteMainGroup);
}

export function useCanUserMainGroup(): boolean {
	return useMainGroupAccess(canUserMainGroup);
}

export function useCanAccessMainGroup(): boolean {
	return useMainGroupAccess(canAccessMainGroup);
}

const MAIN_USER_SCOPE = 'main.user';
const READ_MAIN_USER_SCOPE = 'can_read.main.user';
const CREATE_MAIN_USER_SCOPE = 'can_create.main.user';
const UPDATE_MAIN_USER_SCOPE = 'can_update.main.user';
const DELETE_MAIN_USER_SCOPE = 'can_delete.main.user';
const GROUP_MAIN_USER_SCOPE = 'can_group.main.user';
const ACCESS_MAIN_USER_SCOPE = 'can_access.main.user';
const ROLE_MAIN_USER_SCOPE = 'can_role.main.user';

function canMainUser(actionScope: string): boolean {
	if (!canAccessApp('main')) {
		return false;
	}
	if (isRoot() || isAppRoot('main') || isScopeRoot(MAIN_USER_SCOPE)) {
		return true;
	}

	return Boolean(getLevelScope(MAIN_USER_SCOPE) & getCanScope(actionScope));
}

export function canReadMainUser(): boolean {
	return canMainUser(READ_MAIN_USER_SCOPE);
}

export function canCreateMainUser(): boolean {
	return canMainUser(CREATE_MAIN_USER_SCOPE);
}

export function canUpdateMainUser(): boolean {
	return canMainUser(UPDATE_MAIN_USER_SCOPE);
}

export function canDeleteMainUser(): boolean {
	return canMainUser(DELETE_MAIN_USER_SCOPE);
}

export function canGroupMainUser(): boolean {
	return canMainUser(GROUP_MAIN_USER_SCOPE);
}

export function canAccessMainUser(): boolean {
	return canMainUser(ACCESS_MAIN_USER_SCOPE);
}

export function canRoleMainUser(): boolean {
	return canMainUser(ROLE_MAIN_USER_SCOPE);
}

/** Смена чужого пароля в MainUser — только ROLE_ROOT (не ROLE_MAIN_ROOT). */
export function canChangeMainUserPassword(): boolean {
	return isRoot();
}

function useMainUserAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles]);
}

export function useCanReadMainUser(): boolean {
	return useMainUserAccess(canReadMainUser);
}

export function useCanCreateMainUser(): boolean {
	return useMainUserAccess(canCreateMainUser);
}

export function useCanUpdateMainUser(): boolean {
	return useMainUserAccess(canUpdateMainUser);
}

export function useCanDeleteMainUser(): boolean {
	return useMainUserAccess(canDeleteMainUser);
}

export function useCanGroupMainUser(): boolean {
	return useMainUserAccess(canGroupMainUser);
}

export function useCanAccessMainUser(): boolean {
	return useMainUserAccess(canAccessMainUser);
}

export function useCanRoleMainUser(): boolean {
	return useMainUserAccess(canRoleMainUser);
}

export function useCanChangeMainUserPassword(): boolean {
	return useMainUserAccess(canChangeMainUserPassword);
}
