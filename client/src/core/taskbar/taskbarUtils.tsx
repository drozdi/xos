import type { ComponentType } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import type { AppManifest } from '@/core/appManager/types';
import type { WindowState } from '@/core/windowManager/types';
export interface WindowGroup {
	taskbarGroup: string;
	windows: WindowState[];
}

export function resolveTaskbarGroup(manifest: AppManifest): string {
	return manifest.taskbarGroup ?? manifest.id;
}

function isShownInTaskbar(window: WindowState): boolean {
	if (window.shellRole === 'widget') {
		return false;
	}
	const manifest = AppRegistry.get(window.appId);
	if (manifest?.showInTaskbar === false) {
		return false;
	}
	return true;
}

export function groupWindowsByTaskbarGroup(windows: WindowState[]): WindowGroup[] {
	const groups = new Map<string, WindowState[]>();

	for (const window of windows) {
		if (!isShownInTaskbar(window)) {
			continue;
		}
		const current = groups.get(window.taskbarGroup) ?? [];
		current.push(window);
		groups.set(window.taskbarGroup, current);
	}

	return Array.from(groups.entries()).map(([taskbarGroup, groupWindows]) => ({
		taskbarGroup,
		windows: [...groupWindows].sort((a, b) => a.wmSort - b.wmSort || a.title.localeCompare(b.title)),
	}));
}

/** @deprecated use groupWindowsByTaskbarGroup */
export function groupWindowsByWmGroup(windows: WindowState[]): WindowGroup[] {
	return groupWindowsByTaskbarGroup(windows);
}

export function shouldMinimizeGroup(windows: WindowState[]): boolean {
	return windows.some((window) => !window.minimized);
}

export function isGroupActive(windows: WindowState[], activeWindowId: string | null): boolean {
	return Boolean(activeWindowId && windows.some((window) => window.id === activeWindowId));
}

export function AppIcon({
	icon,
	size = 20,
}: {
	icon: AppManifest['icon'];
	size?: number;
}) {
	if (typeof icon === 'string') {
		return <img src={icon} width={size} height={size} alt="" />;
	}

	const Icon = icon as ComponentType<{ size?: number }>;
	return <Icon size={size} />;
}
