import { beforeEach, describe, expect, it } from 'vitest';

import { createWindowApi, destroyWindowApi } from '@/core/windowManager/WindowApi';

import { useChildWindowStore } from '../childWindowStore';

describe('childWindowStore', () => {
	const parentWindowId = 'parent-window-1';

	beforeEach(() => {
		destroyWindowApi(parentWindowId);
		useChildWindowStore.setState({ byParent: {} });
	});

	it('registers and removes child windows per parent', () => {
		const api = createWindowApi(parentWindowId);

		const first = api.createChildWindow({ title: 'First', width: 320, height: 240 });
		const second = api.createChildWindow({ title: 'Second' });

		expect(useChildWindowStore.getState().getOpenChildren(parentWindowId)).toHaveLength(2);
		expect(useChildWindowStore.getState().getOpenChildren(parentWindowId)[0]?.title).toBe('First');

		first.close();
		expect(useChildWindowStore.getState().getOpenChildren(parentWindowId)).toHaveLength(1);
		expect(useChildWindowStore.getState().getOpenChildren(parentWindowId)[0]?.id).toBe(second.id);

		second.close();
		expect(useChildWindowStore.getState().getOpenChildren(parentWindowId)).toHaveLength(0);
	});

	it('clears children when parent window api is destroyed', () => {
		const api = createWindowApi(parentWindowId);
		api.createChildWindow({ title: 'Child' });

		expect(useChildWindowStore.getState().getOpenChildren(parentWindowId)).toHaveLength(1);

		destroyWindowApi(parentWindowId);
		expect(useChildWindowStore.getState().getOpenChildren(parentWindowId)).toHaveLength(0);
	});
});
