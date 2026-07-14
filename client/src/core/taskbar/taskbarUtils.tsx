import type { ComponentType } from 'react';

import type { AppManifest } from '@/core/appManager/types';
import type { WindowState } from '@/core/windowManager/types';

export interface WindowGroup {
	wmGroup: string;
	windows: WindowState[];
}

export function groupWindowsByWmGroup(windows: WindowState[]): WindowGroup[] {
	const groups = new Map<string, WindowState[]>();

	for (const window of windows) {
		const current = groups.get(window.wmGroup) ?? [];
		current.push(window);
		groups.set(window.wmGroup, current);
	}

	return Array.from(groups.entries()).map(([wmGroup, groupWindows]) => ({
		wmGroup,
		windows: [...groupWindows].sort((a, b) => a.wmSort - b.wmSort || a.title.localeCompare(b.title)),
	}));
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
