import { describe, expect, it } from 'vitest';

import type { AppManifest } from '@/core/appManager/types';

import { buildAppTree, resolvePinnedApps } from '../buildAppTree';

function mockApp(partial: Partial<AppManifest> & Pick<AppManifest, 'id' | 'name'>): AppManifest {
	return {
		version: '1.0.0',
		icon: 'icon.png',
		component: {} as AppManifest['component'],
		defaultSize: { width: 400, height: 300 },
		...partial,
	};
}

describe('buildAppTree', () => {
	it('groups apps by wmGroup with labels', () => {
		const tree = buildAppTree([
			mockApp({ id: 'a', name: 'Alpha', wmGroup: 'games' }),
			mockApp({ id: 'b', name: 'Beta', wmGroup: 'tools' }),
		]);

		expect(tree).toHaveLength(2);
		expect(tree.find((group) => group.id === 'games')?.label).toBe('Игры');
		expect(tree.find((group) => group.id === 'games')?.apps[0]?.id).toBe('a');
	});

	it('uses startMenuGroup when provided', () => {
		const tree = buildAppTree([
			mockApp({ id: 'a', name: 'App', wmGroup: 'tools', startMenuGroup: 'custom' }),
		]);

		expect(tree[0]?.id).toBe('custom');
	});

	it('uses startMenuGroup independently from taskbarGroup', () => {
		const tree = buildAppTree([
			mockApp({
				id: 'a',
				name: 'App',
				wmGroup: 'tools',
				startMenuGroup: 'games',
				taskbarGroup: 'tools',
			}),
		]);

		expect(tree[0]?.id).toBe('games');
	});

	it('excludes apps with startMenu false from tree', () => {
		const tree = buildAppTree([
			mockApp({ id: 'list', name: 'List', startMenuGroup: 'admin' }),
			mockApp({ id: 'detail', name: 'Detail', startMenuGroup: 'admin', startMenu: false }),
		]);

		expect(tree.find((group) => group.id === 'admin')?.apps).toHaveLength(1);
		expect(tree.find((group) => group.id === 'admin')?.apps[0]?.id).toBe('list');
	});

	it('excludes apps with startMenuList false from tree but keeps them pinnable', () => {
		const apps = [
			mockApp({ id: 'list', name: 'List', startMenuGroup: 'admin' }),
			mockApp({
				id: 'hidden',
				name: 'Hidden',
				startMenuGroup: 'admin',
				startMenuList: false,
			}),
		];
		const tree = buildAppTree(apps);

		expect(tree.find((group) => group.id === 'admin')?.apps).toHaveLength(1);
		expect(tree.find((group) => group.id === 'admin')?.apps[0]?.id).toBe('list');
		expect(resolvePinnedApps(['hidden'], apps).map((app) => app.id)).toEqual(['hidden']);
	});

	it('sorts apps by startMenuSort then name', () => {
		const tree = buildAppTree([
			mockApp({ id: 'c', name: 'Charlie', startMenuGroup: 'device', startMenuSort: 30 }),
			mockApp({ id: 'a', name: 'Alpha', startMenuGroup: 'device', startMenuSort: 10 }),
			mockApp({ id: 'b', name: 'Bravo', startMenuGroup: 'device', startMenuSort: 10 }),
		]);

		expect(tree.find((group) => group.id === 'device')?.apps.map((app) => app.id)).toEqual([
			'a',
			'b',
			'c',
		]);
	});

	it('falls back to wmSort when startMenuSort is not set', () => {
		const tree = buildAppTree([
			mockApp({ id: 'b', name: 'Beta', startMenuGroup: 'device', wmSort: 2 }),
			mockApp({ id: 'a', name: 'Alpha', startMenuGroup: 'device', wmSort: 1 }),
		]);

		expect(tree.find((group) => group.id === 'device')?.apps.map((app) => app.id)).toEqual([
			'a',
			'b',
		]);
	});

	it('sorts groups by START_MENU_GROUP_SORT', () => {
		const tree = buildAppTree([
			mockApp({ id: 'd', name: 'Device', startMenuGroup: 'device' }),
			mockApp({ id: 'g', name: 'Game', startMenuGroup: 'games' }),
			mockApp({ id: 'a', name: 'Admin', startMenuGroup: 'admin' }),
		]);

		expect(tree.map((group) => group.id)).toEqual(['games', 'admin', 'device']);
	});

	it('passes startMenuBorderTop into app tree items', () => {
		const tree = buildAppTree([
			mockApp({ id: 'a', name: 'Alpha', startMenuGroup: 'device', startMenuBorderTop: true }),
			mockApp({ id: 'b', name: 'Beta', startMenuGroup: 'device' }),
		]);

		const apps = tree.find((group) => group.id === 'device')?.apps;
		expect(apps?.[0]?.borderTop).toBe(true);
		expect(apps?.[1]?.borderTop).toBeFalsy();
	});

	it('resolves pinned apps in order', () => {
		const apps = [
			mockApp({ id: 'b', name: 'B' }),
			mockApp({ id: 'a', name: 'A' }),
		];

		expect(resolvePinnedApps(['a', 'b', 'missing'], apps).map((app) => app.id)).toEqual([
			'a',
			'b',
		]);
	});
});
