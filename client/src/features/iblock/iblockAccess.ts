import { useMemo } from 'react';

import { useAuthStore } from '@/core/auth/authStore';
import { canAccessApp, isAppRoot, isRoot, isScopeRoot } from '@/core/auth/coreRoles';
import { getCanScope, getLevelScope } from '@/core/auth/coreScopes';

function canIblockScope(scopePath: string, actionScope: string): boolean {
	if (!canAccessApp('iblock')) {
		return false;
	}
	if (isRoot() || isAppRoot('iblock') || isScopeRoot(scopePath)) {
		return true;
	}

	return Boolean(getLevelScope(scopePath) & getCanScope(actionScope));
}

function useIblockAccess(check: () => boolean): boolean {
	const scopes = useAuthStore((state) => state.scopes);
	const roles = useAuthStore((state) => state.user?.roles);

	return useMemo(() => check(), [scopes, roles, check]);
}

function createIblockCrudAccess(scopePath: string) {
	const can = (action: string) => canIblockScope(scopePath, `${action}.${scopePath}`);

	return {
		canRead: () => can('can_read'),
		canCreate: () => can('can_create'),
		canUpdate: () => can('can_update'),
		canDelete: () => can('can_delete'),
		useCanRead: () => useIblockAccess(() => can('can_read')),
		useCanCreate: () => useIblockAccess(() => can('can_create')),
		useCanUpdate: () => useIblockAccess(() => can('can_update')),
		useCanDelete: () => useIblockAccess(() => can('can_delete')),
	};
}

const TYPE_SCOPE = 'iblock.type';
const BLOCK_SCOPE = 'iblock.block';
const SECTION_SCOPE = 'iblock.section';
const ELEMENT_SCOPE = 'iblock.element';
const PROPERTY_SCOPE = 'iblock.property';

const typeCrud = createIblockCrudAccess(TYPE_SCOPE);
const blockCrud = createIblockCrudAccess(BLOCK_SCOPE);
const sectionCrud = createIblockCrudAccess(SECTION_SCOPE);
const elementCrud = createIblockCrudAccess(ELEMENT_SCOPE);
const propertyCrud = createIblockCrudAccess(PROPERTY_SCOPE);

export const canReadIblockType = typeCrud.canRead;
export const canCreateIblockType = typeCrud.canCreate;
export const canUpdateIblockType = typeCrud.canUpdate;
export const canDeleteIblockType = typeCrud.canDelete;
export const useCanReadIblockType = typeCrud.useCanRead;
export const useCanCreateIblockType = typeCrud.useCanCreate;
export const useCanUpdateIblockType = typeCrud.useCanUpdate;
export const useCanDeleteIblockType = typeCrud.useCanDelete;

export const canReadIblockBlock = blockCrud.canRead;
export const canCreateIblockBlock = blockCrud.canCreate;
export const canUpdateIblockBlock = blockCrud.canUpdate;
export const canDeleteIblockBlock = blockCrud.canDelete;
export const useCanReadIblockBlock = blockCrud.useCanRead;
export const useCanCreateIblockBlock = blockCrud.useCanCreate;
export const useCanUpdateIblockBlock = blockCrud.useCanUpdate;
export const useCanDeleteIblockBlock = blockCrud.useCanDelete;

export const canReadIblockSection = sectionCrud.canRead;
export const canCreateIblockSection = sectionCrud.canCreate;
export const canUpdateIblockSection = sectionCrud.canUpdate;
export const canDeleteIblockSection = sectionCrud.canDelete;
export const useCanReadIblockSection = sectionCrud.useCanRead;
export const useCanCreateIblockSection = sectionCrud.useCanCreate;
export const useCanUpdateIblockSection = sectionCrud.useCanUpdate;
export const useCanDeleteIblockSection = sectionCrud.useCanDelete;

export const canReadIblockElement = elementCrud.canRead;
export const canCreateIblockElement = elementCrud.canCreate;
export const canUpdateIblockElement = elementCrud.canUpdate;
export const canDeleteIblockElement = elementCrud.canDelete;
export const useCanReadIblockElement = elementCrud.useCanRead;
export const useCanCreateIblockElement = elementCrud.useCanCreate;
export const useCanUpdateIblockElement = elementCrud.useCanUpdate;
export const useCanDeleteIblockElement = elementCrud.useCanDelete;

export const canReadIblockProperty = propertyCrud.canRead;
export const canCreateIblockProperty = propertyCrud.canCreate;
export const canUpdateIblockProperty = propertyCrud.canUpdate;
export const canDeleteIblockProperty = propertyCrud.canDelete;
export const useCanReadIblockProperty = propertyCrud.useCanRead;
export const useCanCreateIblockProperty = propertyCrud.useCanCreate;
export const useCanUpdateIblockProperty = propertyCrud.useCanUpdate;
export const useCanDeleteIblockProperty = propertyCrud.useCanDelete;
