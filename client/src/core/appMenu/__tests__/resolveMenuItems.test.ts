import { describe, expect, it, vi } from 'vitest';

import { hasVisibleMenuEntries, resolveAppMenuItems } from '../resolveMenuItems';
import type { AppMenuActionContext, AppMenuEntry } from '../types';

function createContext(): AppMenuActionContext {
	return {
		appId: 'demo',
		windowId: 'demo__default',
		instanceKey: 'default',
		coreApi: {} as AppMenuActionContext['coreApi'],
	};
}

describe('resolveAppMenuItems', () => {
	it('filters hidden items', () => {
		const items: AppMenuEntry[] = [
			{ id: 'visible', label: 'Visible', onClick: vi.fn() },
			{ id: 'hidden', label: 'Hidden', hidden: true, onClick: vi.fn() },
		];

		const resolved = resolveAppMenuItems(items, createContext());
		expect(resolved.map((item) => ('id' in item ? item.id : item.type))).toEqual(['visible']);
	});

	it('keeps submenu only when it has visible children', () => {
		const items: AppMenuEntry[] = [
			{
				id: 'file',
				type: 'submenu',
				label: 'File',
				items: [{ id: 'hidden', label: 'Hidden', hidden: true }],
			},
		];

		expect(resolveAppMenuItems(items, createContext())).toEqual([]);
	});
});

describe('hasVisibleMenuEntries', () => {
	it('returns false for divider-only list', () => {
		expect(hasVisibleMenuEntries([{ type: 'divider' }])).toBe(false);
	});
});
