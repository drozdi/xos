import { describe, expect, it } from 'vitest';

import {
	buildDragCancelSelector,
	resolveWindowDragConfig,
	XOS_WINDOW_TITLEBAR_CLASS,
} from '../windowDrag';

describe('windowDrag', () => {
	it('uses titlebar as default drag handle', () => {
		const config = resolveWindowDragConfig();
		expect(config.dragHandles).toEqual([`.${XOS_WINDOW_TITLEBAR_CLASS}`]);
	});

	it('replaces default drag handles when configured', () => {
		const config = resolveWindowDragConfig({
			dragHandles: ['.custom-toolbar'],
		});
		expect(config.dragHandles).toEqual(['.custom-toolbar']);
	});

	it('builds cancel selector from dragCancel list', () => {
		expect(buildDragCancelSelector(['.no-drag', 'button'])).toBe('.no-drag, button');
	});
});
