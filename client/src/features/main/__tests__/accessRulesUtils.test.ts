import { describe, expect, it } from 'vitest';

import {
	applyModuleAccessMode,
	getModuleAccessMode,
	groupClaimantsByModule,
	resolveClaimantAccessMap,
} from '@/features/main/accessRulesUtils';

const mainMap = {
	user: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
	group: { can_create: 1, can_read: 2 },
};

describe('accessRulesUtils', () => {
	it('groups claimants by module', () => {
		const groups = groupClaimantsByModule([
			{ id: 1, code: 'main', name: 'Main' },
			{ id: 2, code: 'main.user', name: 'Пользователи' },
			{ id: 3, code: 'device.type', name: 'Типы' },
		]);

		expect(groups).toHaveLength(2);
		expect(groups[0]?.children).toHaveLength(1);
		expect(groups[1]?.children).toHaveLength(1);
	});

	it('resolves scope map from setting structure', () => {
		expect(resolveClaimantAccessMap('main.user', { main: mainMap })).toEqual({
			can_create: 1,
			can_read: 2,
			can_update: 4,
			can_delete: 8,
		});
	});

	it('detects module access mode from roles', () => {
		expect(getModuleAccessMode('main', ['ROLE_MAIN_ROOT'], {}, [])).toBe('full');
		expect(getModuleAccessMode('main', ['ROLE_MAIN'], {}, [])).toBe('available');
		expect(getModuleAccessMode('main', [], {}, [])).toBe('none');
	});

	it('applies full module mode via root role', () => {
		const result = applyModuleAccessMode('main', 'full', ['ROLE_MAIN'], {}, [
			{ id: 2, code: 'main.user', name: 'Пользователи' },
		]);

		expect(result.roles).toContain('ROLE_MAIN_ROOT');
		expect(result.roles).not.toContain('ROLE_MAIN');
	});
});
