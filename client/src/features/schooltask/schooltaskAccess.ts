import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { canAccessApp, isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

function canSchooltaskScope(scopePath: string, actionScope: string): boolean {
	if (!canAccessApp('schooltask')) {
		return false;
	}
	if (isRoot() || isAppRoot('schooltask') || isScopeRoot(scopePath)) {
		return true;
	}

	return Boolean(getLevelScope(scopePath) & getCanScope(actionScope));
}

function useSchooltaskAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles, check]);
}

function createSchooltaskCrudAccess(scopePath: string) {
	const can = (action: string) => canSchooltaskScope(scopePath, `${action}.${scopePath}`);

	return {
		canRead: () => can('can_read'),
		canCreate: () => can('can_create'),
		canUpdate: () => can('can_update'),
		canDelete: () => can('can_delete'),
		useCanRead: () => useSchooltaskAccess(() => can('can_read')),
		useCanCreate: () => useSchooltaskAccess(() => can('can_create')),
		useCanUpdate: () => useSchooltaskAccess(() => can('can_update')),
		useCanDelete: () => useSchooltaskAccess(() => can('can_delete')),
	};
}

const SUBJECT_SCOPE = 'schooltask.subject';
const CLASS_SCOPE = 'schooltask.class';
const EVENT_SCOPE = 'schooltask.event';
const ZAM_SCOPE = 'schooltask.zam';

const subjectCrud = createSchooltaskCrudAccess(SUBJECT_SCOPE);
const classCrud = createSchooltaskCrudAccess(CLASS_SCOPE);
const eventCrud = createSchooltaskCrudAccess(EVENT_SCOPE);
const zamCrud = createSchooltaskCrudAccess(ZAM_SCOPE);

export const canReadSchooltaskSubject = subjectCrud.canRead;
export const canCreateSchooltaskSubject = subjectCrud.canCreate;
export const canUpdateSchooltaskSubject = subjectCrud.canUpdate;
export const canDeleteSchooltaskSubject = subjectCrud.canDelete;
export const useCanReadSchooltaskSubject = subjectCrud.useCanRead;
export const useCanCreateSchooltaskSubject = subjectCrud.useCanCreate;
export const useCanUpdateSchooltaskSubject = subjectCrud.useCanUpdate;
export const useCanDeleteSchooltaskSubject = subjectCrud.useCanDelete;

export const canReadSchooltaskClass = classCrud.canRead;
export const canCreateSchooltaskClass = classCrud.canCreate;
export const canUpdateSchooltaskClass = classCrud.canUpdate;
export const canDeleteSchooltaskClass = classCrud.canDelete;
export const useCanReadSchooltaskClass = classCrud.useCanRead;
export const useCanCreateSchooltaskClass = classCrud.useCanCreate;
export const useCanUpdateSchooltaskClass = classCrud.useCanUpdate;
export const useCanDeleteSchooltaskClass = classCrud.useCanDelete;

export const canReadSchooltaskEvent = eventCrud.canRead;
export const canCreateSchooltaskEvent = eventCrud.canCreate;
export const canUpdateSchooltaskEvent = eventCrud.canUpdate;
export const canDeleteSchooltaskEvent = eventCrud.canDelete;
export const useCanReadSchooltaskEvent = eventCrud.useCanRead;
export const useCanCreateSchooltaskEvent = eventCrud.useCanCreate;
export const useCanUpdateSchooltaskEvent = eventCrud.useCanUpdate;
export const useCanDeleteSchooltaskEvent = eventCrud.useCanDelete;

export const canReadSchooltaskZam = zamCrud.canRead;
export const canCreateSchooltaskZam = zamCrud.canCreate;
export const canUpdateSchooltaskZam = zamCrud.canUpdate;
export const canDeleteSchooltaskZam = zamCrud.canDelete;
export const useCanReadSchooltaskZam = zamCrud.useCanRead;
export const useCanCreateSchooltaskZam = zamCrud.useCanCreate;
export const useCanUpdateSchooltaskZam = zamCrud.useCanUpdate;
export const useCanDeleteSchooltaskZam = zamCrud.useCanDelete;
