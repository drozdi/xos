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
