import { describe, expect, it } from 'vitest';

import type { AppManifest } from '@/core/appManager/types';
import type { WindowState } from '@/core/windowManager/types';

import { resolveContextMenuItems } from '../resolveMenuItems';
import type { ContextMenuContext } from '../types';
import { isContextMenuItem } from '../types';

function createManifest(overrides: Partial<AppManifest> = {}): AppManifest {
	return {
		id: 'demo-app',
		name: 'Demo',
		version: '1.0.0',
		icon: 'icon.png',
		component: {} as AppManifest['component'],
		defaultSize: { width: 400, height: 300 },
		...overrides,
	};
}

function createWindow(overrides: Partial<WindowState> = {}): WindowState {
	return {
		id: 'demo-app__default',
		appId: 'demo-app',
		instanceKey: 'default',
		title: 'Demo',
		x: 0,
		y: 0,
		width: 400,
		height: 300,
		zIndex: 100,
		minimized: false,
		maximized: false,
		wmGroup: 'default',
		wmSort: 0,
		contentKey: 0,
		resizable: true,
		positionFixed: false,
		autoSize: false,
		taskbarGroup: 'default',
		...overrides,
	};
}

describe('resolveContextMenuItems', () => {
	it('includes base window actions for a normal window', () => {
		const manifest = createManifest();
		const window = createWindow();
		const ctx: ContextMenuContext = {
			scope: 'window',
			appId: manifest.id,
			manifest,
			windowId: window.id,
			instanceKey: window.instanceKey,
			window,
		};

		const items = resolveContextMenuItems('window', ctx, manifest);
		const ids = items.filter((item) => !('type' in item)).map((item) => item.id);

		expect(ids).toContain('close');
		expect(ids).toContain('minimize');
		expect(ids).toContain('maximize');
		expect(ids).toContain('refresh');
	});

	it('hides base item when override is false', () => {
		const manifest = createManifest({
			contextMenu: {
				windowOverrides: {
					refresh: false,
				},
			},
		});
		const window = createWindow();
		const ctx: ContextMenuContext = {
			scope: 'window',
			appId: manifest.id,
			manifest,
			windowId: window.id,
			window,
		};

		const items = resolveContextMenuItems('window', ctx, manifest);
		const ids = items.filter((item) => !('type' in item)).map((item) => item.id);

		expect(ids).not.toContain('refresh');
	});

	it('appends custom taskbar items and hides new window for single instance apps', () => {
		const manifest = createManifest({
			singleInstance: true,
			contextMenu: {
				taskbar: () => [
					{
						id: 'custom-action',
						label: 'Custom',
						onClick: () => undefined,
					},
				],
			},
		});
		const window = createWindow();
		const ctx: ContextMenuContext = {
			scope: 'taskbar',
			appId: manifest.id,
			manifest,
			windowId: window.id,
			instanceKey: window.instanceKey,
			window,
			windows: [window],
			wmGroup: window.wmGroup,
		};

		const items = resolveContextMenuItems('taskbar', ctx, manifest);
		const ids = items.filter((item) => !('type' in item)).map((item) => item.id);

		expect(ids).toContain('custom-action');
		expect(ids).not.toContain('new-window');
		expect(ids).toContain('close');
		expect(ids).not.toContain('close-all');
	});

	it('shows per-window minimize/restore in grouped taskbar item menu', () => {
		const manifest = createManifest({ singleInstance: true });
		const window = createWindow({ minimized: true });
		const ctx: ContextMenuContext = {
			scope: 'taskbar',
			appId: manifest.id,
			manifest,
			windowId: window.id,
			window,
			windows: [window],
			wmGroup: 'games',
		};

		const items = resolveContextMenuItems('taskbar', ctx, manifest);
		const labels = items
			.filter(isContextMenuItem)
			.map((item) => item.label);

		expect(labels).toContain('Restore');
		expect(labels).not.toContain('Close all');
	});
});
