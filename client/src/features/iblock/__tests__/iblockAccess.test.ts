import { beforeEach, describe, expect, it } from 'vitest';

import { isAppRoot, isRoot, isScopeRoot, resetUserRoles, setUserRoles } from '@/core/auth/coreRoles';
import { joinScopes, resetScopes, setLevelScopes } from '@/core/auth/coreScopes';

import {
	canCreateIblockBlock,
	canReadIblockElement,
	canReadIblockType,
	canUpdateIblockProperty,
} from '@/features/iblock/iblockAccess';

describe('iblockAccess', () => {
	beforeEach(() => {
		resetUserRoles();
		resetScopes();
		setLevelScopes({});
		joinScopes('iblock', {
			type: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			block: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			section: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			element: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			property: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
		});
	});

	it('allows read for ROLE_IBLOCK_ROOT', () => {
		setUserRoles(['ROLE_IBLOCK_ROOT']);
		expect(isAppRoot('iblock')).toBe(true);
		expect(canReadIblockType()).toBe(true);
		expect(canReadIblockElement()).toBe(true);
	});

	it('allows type read for ROLE_IBLOCK_TYPE_ROOT with module role', () => {
		setUserRoles(['ROLE_IBLOCK', 'ROLE_IBLOCK_TYPE_ROOT']);
		expect(isScopeRoot('iblock.type')).toBe(true);
		expect(canReadIblockType()).toBe(true);
		expect(canReadIblockElement()).toBe(false);
	});

	it('allows block create with can_create bit', () => {
		setUserRoles(['ROLE_IBLOCK']);
		setLevelScopes({ 'iblock.block': 1 });
		expect(canCreateIblockBlock()).toBe(true);
		expect(canReadIblockType()).toBe(false);
	});

	it('allows property update with can_update bit', () => {
		setUserRoles(['ROLE_IBLOCK']);
		setLevelScopes({ 'iblock.property': 4 });
		expect(canUpdateIblockProperty()).toBe(true);
		expect(canReadIblockElement()).toBe(false);
	});

	it('allows all for ROLE_ROOT', () => {
		setUserRoles(['ROLE_ROOT']);
		expect(isRoot()).toBe(true);
		expect(canReadIblockType()).toBe(true);
		expect(canCreateIblockBlock()).toBe(true);
	});

	it('denies without ROLE_IBLOCK even with scopes', () => {
		setUserRoles(['ROLE_USER']);
		setLevelScopes({ 'iblock.type': 2 });
		expect(canReadIblockType()).toBe(false);
	});
});
