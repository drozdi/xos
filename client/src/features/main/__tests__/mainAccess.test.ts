import { beforeEach, describe, expect, it } from 'vitest';

import {
	isAppRoot,
	isRoot,
	isScopeRoot,
	resetUserRoles,
	scopePathToRolePrefix,
	setUserRoles,
} from '@/core/auth/coreRoles';
import { joinScopes, resetScopes, setLevelScopes } from '@/core/auth/coreScopes';

import {
	canCreateMainClaimant,
	canCreateMainGroup,
	canCreateMainOu,
	canDeleteMainClaimant,
	canDeleteMainGroup,
	canDeleteMainOu,
	canReadMainClaimant,
	canReadMainGroup,
	canReadMainOu,
	canUpdateMainClaimant,
	canUpdateMainGroup,
	canUpdateMainOu,
} from '@/features/main/mainAccess';

describe('mainAccess', () => {
	beforeEach(() => {
		resetUserRoles();
		resetScopes();
		setLevelScopes({});
		joinScopes('main', {
			user: { can_create: 1 },
			group: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			ou: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			claimant: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
		});
	});

	it('allows create for ROLE_ROOT', () => {
		setUserRoles(['ROLE_ROOT']);
		expect(canCreateMainOu()).toBe(true);
	});

	it('allows create for ROLE_MAIN_ROOT', () => {
		setUserRoles(['ROLE_MAIN_ROOT']);
		expect(canCreateMainOu()).toBe(true);
	});

	it('allows create for ROLE_MAIN_OU_ROOT', () => {
		setUserRoles(['ROLE_MAIN_OU_ROOT']);
		expect(isScopeRoot('main.ou')).toBe(true);
		expect(canCreateMainOu()).toBe(true);
	});

	it('allows create with can_create.main.ou scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.ou': 1 });
		expect(canCreateMainOu()).toBe(true);
	});

	it('denies create for ROLE_MAIN_ADMIN without scope', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		setLevelScopes({ 'main.ou': 0 });
		expect(canCreateMainOu()).toBe(false);
	});

	it('denies create for ROLE_MAIN without scope', () => {
		setUserRoles(['ROLE_MAIN']);
		expect(canCreateMainOu()).toBe(false);
	});

	it('allows read for ROLE_MAIN_OU_ROOT', () => {
		setUserRoles(['ROLE_MAIN_OU_ROOT']);
		expect(canReadMainOu()).toBe(true);
	});

	it('allows read with can_read.main.ou scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.ou': 2 });
		expect(canReadMainOu()).toBe(true);
	});

	it('denies read with only can_create scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.ou': 1 });
		expect(canReadMainOu()).toBe(false);
		expect(canCreateMainOu()).toBe(true);
	});

	it('denies read for ROLE_MAIN_ADMIN without scope', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(canReadMainOu()).toBe(false);
	});

	it('allows update with can_update.main.ou scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.ou': 4 });
		expect(canUpdateMainOu()).toBe(true);
	});

	it('denies update for ROLE_MAIN_ADMIN without scope', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(canUpdateMainOu()).toBe(false);
	});

	it('allows delete with can_delete.main.ou scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.ou': 8 });
		expect(canDeleteMainOu()).toBe(true);
	});

	it('denies delete for ROLE_MAIN_ADMIN without scope', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(canDeleteMainOu()).toBe(false);
	});
});

describe('mainClaimantAccess', () => {
	beforeEach(() => {
		resetUserRoles();
		resetScopes();
		setLevelScopes({});
		joinScopes('main', {
			claimant: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
		});
	});

	it('allows read for ROLE_MAIN_CLAIMANT_ROOT', () => {
		setUserRoles(['ROLE_MAIN_CLAIMANT_ROOT']);
		expect(isScopeRoot('main.claimant')).toBe(true);
		expect(canReadMainClaimant()).toBe(true);
	});

	it('allows create with can_create.main.claimant scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.claimant': 1 });
		expect(canCreateMainClaimant()).toBe(true);
	});

	it('denies read for ROLE_MAIN_ADMIN without scope', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(canReadMainClaimant()).toBe(false);
	});

	it('allows update with can_update.main.claimant scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.claimant': 4 });
		expect(canUpdateMainClaimant()).toBe(true);
	});

	it('allows delete with can_delete.main.claimant scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.claimant': 8 });
		expect(canDeleteMainClaimant()).toBe(true);
	});
});

describe('mainGroupAccess', () => {
	beforeEach(() => {
		resetUserRoles();
		resetScopes();
		setLevelScopes({});
		joinScopes('main', {
			group: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
		});
	});

	it('allows read for ROLE_MAIN_GROUP_ROOT', () => {
		setUserRoles(['ROLE_MAIN_GROUP_ROOT']);
		expect(isScopeRoot('main.group')).toBe(true);
		expect(canReadMainGroup()).toBe(true);
	});

	it('allows create with can_create.main.group scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.group': 1 });
		expect(canCreateMainGroup()).toBe(true);
	});

	it('denies read for ROLE_MAIN_ADMIN without scope', () => {
		setUserRoles(['ROLE_MAIN_ADMIN']);
		expect(canReadMainGroup()).toBe(false);
	});

	it('allows update with can_update.main.group scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.group': 4 });
		expect(canUpdateMainGroup()).toBe(true);
	});

	it('allows delete with can_delete.main.group scope', () => {
		setUserRoles(['ROLE_MAIN']);
		setLevelScopes({ 'main.group': 8 });
		expect(canDeleteMainGroup()).toBe(true);
	});
});

describe('scopePathToRolePrefix', () => {
	it('converts dotted scope path to role prefix', () => {
		expect(scopePathToRolePrefix('main.ou')).toBe('MAIN_OU');
		expect(scopePathToRolePrefix('main.claimant')).toBe('MAIN_CLAIMANT');
		expect(scopePathToRolePrefix('main.group')).toBe('MAIN_GROUP');
	});
});
