import { beforeEach, describe, expect, it } from 'vitest';

import { isAppRoot, isRoot, isScopeRoot, resetUserRoles, setUserRoles } from '@/core/auth/coreRoles';
import { joinScopes, resetScopes, setLevelScopes } from '@/core/auth/coreScopes';

import {
	canCreateSchooltaskClass,
	canReadSchooltaskEvent,
	canReadSchooltaskSubject,
	canReadSchooltaskZam,
	canUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';

describe('schooltaskAccess', () => {
	beforeEach(() => {
		resetUserRoles();
		resetScopes();
		setLevelScopes({});
		joinScopes('schooltask', {
			subject: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			class: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			event: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
			zam: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
		});
	});

	it('allows read for ROLE_SCHOOLTASK_ROOT', () => {
		setUserRoles(['ROLE_SCHOOLTASK_ROOT']);
		expect(isAppRoot('schooltask')).toBe(true);
		expect(canReadSchooltaskSubject()).toBe(true);
	});

	it('allows subject read for ROLE_SCHOOLTASK_SUBJECT_ROOT', () => {
		setUserRoles(['ROLE_SCHOOLTASK_SUBJECT_ROOT']);
		expect(isScopeRoot('schooltask.subject')).toBe(true);
		expect(canReadSchooltaskSubject()).toBe(true);
	});

	it('allows class create with can_create bit', () => {
		setUserRoles(['ROLE_SCHOOLTASK']);
		setLevelScopes({ 'schooltask.class': 1 });
		expect(canCreateSchooltaskClass()).toBe(true);
	});

	it('allows event update with can_update bit', () => {
		setUserRoles(['ROLE_SCHOOLTASK']);
		setLevelScopes({ 'schooltask.event': 4 });
		expect(canUpdateSchooltaskEvent()).toBe(true);
		expect(canReadSchooltaskEvent()).toBe(false);
	});

	it('allows zam read with can_read bit', () => {
		setUserRoles(['ROLE_SCHOOLTASK']);
		setLevelScopes({ 'schooltask.zam': 2 });
		expect(canReadSchooltaskZam()).toBe(true);
	});

	it('allows all for ROLE_ROOT', () => {
		setUserRoles(['ROLE_ROOT']);
		expect(isRoot()).toBe(true);
		expect(canReadSchooltaskEvent()).toBe(true);
	});
});
