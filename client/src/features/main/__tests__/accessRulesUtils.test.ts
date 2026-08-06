import { describe, expect, it } from 'vitest';

import {
	applyModuleAccessMode,
	checkedToLevel,
	getModuleAccessMode,
	getModuleScopeClaimants,
	groupClaimantsByModule,
	labelsFromAccessOptions,
	levelToChecked,
	resolveClaimantAccessMap,
	resolveClaimantScopeLabels,
	resolveClaimantScopeMap,
	scopeMapFromAccessOptions,
} from '@/features/main/accessRulesUtils';

const mainMap = {
	user: { can_create: 1, can_read: 2, can_update: 4, can_delete: 8 },
	group: { can_create: 1, can_read: 2 },
};

const userOptions = {
	can_create: { bit: 1, title: 'Создание' },
	can_read: { bit: 2, title: 'Чтение' },
	can_update: { bit: 4, title: 'Изменение' },
	can_delete: { bit: 8, title: 'Удаление' },
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

	it('builds scopeMap and labels from access_options', () => {
		expect(scopeMapFromAccessOptions(userOptions)).toEqual({
			can_create: 1,
			can_read: 2,
			can_update: 4,
			can_delete: 8,
		});
		expect(labelsFromAccessOptions(userOptions)).toEqual({
			can_create: 'Создание',
			can_read: 'Чтение',
			can_update: 'Изменение',
			can_delete: 'Удаление',
		});
	});

	it('prefers access_options over legacy module map', () => {
		const claimant = {
			id: 2,
			code: 'main.user',
			name: 'Пользователи',
			access_options: {
				can_read: { bit: 2, title: 'Чтение из API' },
			},
		};

		expect(resolveClaimantScopeMap(claimant, { main: mainMap })).toEqual({
			can_read: 2,
		});
		expect(resolveClaimantScopeLabels(claimant, { can_read: 2 })).toEqual({
			can_read: 'Чтение из API',
		});
	});

	it('falls back to legacy map when access_options empty', () => {
		const claimant = {
			id: 2,
			code: 'main.user',
			name: 'Пользователи',
			access_options: {},
		};

		expect(resolveClaimantScopeMap(claimant, { main: mainMap })).toEqual({
			can_create: 1,
			can_read: 2,
			can_update: 4,
			can_delete: 8,
		});
		expect(resolveClaimantScopeLabels(claimant, { can_create: 1 })).toEqual({
			can_create: 'Создание',
		});
	});

	it('resolves scope map from setting structure (legacy)', () => {
		expect(resolveClaimantAccessMap('main.user', { main: mainMap })).toEqual({
			can_create: 1,
			can_read: 2,
			can_update: 4,
			can_delete: 8,
		});
		expect(resolveClaimantAccessMap('explorer', { explorer: { can_read: 1, can_write: 2 } })).toEqual({
			can_read: 1,
			can_write: 2,
		});
		expect(
			resolveClaimantAccessMap('explorer', {
				explorer: { can_read: { bit: 1, title: 'Чтение' }, can_write: 2 },
			}),
		).toEqual({
			can_read: 1,
			can_write: 2,
		});
	});

	it('filters module scope claimants by access_options', () => {
		const claimants = getModuleScopeClaimants({
			module: 'main',
			moduleLabel: 'Main',
			children: [
				{
					id: 2,
					code: 'main.user',
					name: 'Пользователи',
					access_options: userOptions,
				},
				{
					id: 3,
					code: 'main.empty',
					name: 'Пустой',
					access_options: {},
				},
			],
		});

		expect(claimants).toHaveLength(1);
		expect(claimants[0]?.id).toBe(2);
	});

	it('keeps levelToChecked / checkedToLevel bit semantics', () => {
		const scopeMap = scopeMapFromAccessOptions(userOptions);
		expect(levelToChecked(5, scopeMap)).toEqual({
			can_create: true,
			can_read: false,
			can_update: true,
			can_delete: false,
		});
		expect(
			checkedToLevel(
				{ can_create: true, can_read: true, can_update: false, can_delete: false },
				scopeMap,
			),
		).toBe(3);
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
