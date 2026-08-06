import { isPageUnloading } from '@/core/lifecycle/pageLifecycle';
import { settingManager } from '@/core/settings/SettingManager';

import { useWmStore } from './useWmStore';
import type { PersistedWindowState, WindowState } from './types';

const DEBOUNCE_MS = 300;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

export function makeWinSettingKey(appId: string, windowId: string): string {
	return `${appId}/${windowId}`;
}

export function parseWinSettingKey(key: string): { appId: string; windowId: string } | null {
	const slashIndex = key.indexOf('/');
	if (slashIndex <= 0 || slashIndex === key.length - 1) {return null;}
	return {
		appId: key.slice(0, slashIndex),
		windowId: key.slice(slashIndex + 1),
	};
}

export function toPersistedState(window: WindowState): PersistedWindowState {
	return {
		position: {
			x: window.x,
			y: window.y,
			width: window.width,
			height: window.height,
		},
		state: {
			minimized: window.minimized,
			maximized: window.maximized,
		},
		wmGroup: window.wmGroup,
		wmSort: window.wmSort,
		title: window.title,
	};
}

export function fromPersistedState(
	windowId: string,
	appId: string,
	persisted: PersistedWindowState,
): {
	id: string;
	appId: string;
	instanceKey: string;
	title: string;
	x: number;
	y: number;
	width: number;
	height: number;
	minimized: boolean;
	maximized: boolean;
	wmGroup: string;
	wmSort: number;
} {
	const instanceKey = windowId.includes('__') ? windowId.split('__').slice(1).join('__') : windowId;
	return {
		id: windowId,
		appId,
		instanceKey,
		title: persisted.title,
		x: persisted.position.x,
		y: persisted.position.y,
		width: persisted.position.width,
		height: persisted.position.height,
		minimized: persisted.state.minimized,
		maximized: persisted.state.maximized,
		wmGroup: persisted.wmGroup,
		wmSort: persisted.wmSort,
	};
}

export function isPersistedWindowState(value: unknown): value is PersistedWindowState {
	if (!value || typeof value !== 'object') {return false;}
	const record = value as Record<string, unknown>;
	const position = record.position;
	const state = record.state;
	if (!position || typeof position !== 'object' || !state || typeof state !== 'object') {
		return false;
	}
	const pos = position as Record<string, unknown>;
	const st = state as Record<string, unknown>;
	return (
		typeof pos.x === 'number' &&
		typeof pos.y === 'number' &&
		typeof pos.width === 'number' &&
		typeof pos.height === 'number' &&
		typeof st.minimized === 'boolean' &&
		typeof st.maximized === 'boolean'
	);
}

export async function persistWindowNow(windowId: string): Promise<void> {
	if (!settingManager.isInitialized()) {return;}

	const window = useWmStore.getState().windows[windowId];
	if (!window) {return;}

	const key = makeWinSettingKey(window.appId, windowId);
	await settingManager.set('WIN', key, toPersistedState(window));
}

/** Flush latest geometry for open windows (and API pending). Used after drag and on unload. */
export async function persistAllOpenWindowsNow(): Promise<void> {
	if (!settingManager.isInitialized()) {return;}
	const ids = Object.keys(useWmStore.getState().windows);
	await Promise.all(ids.map((id) => persistWindowNow(id)));
	await settingManager.flush();
}

export function schedulePersistWindow(windowId: string): void {
	const existing = timers.get(windowId);
	if (existing) {clearTimeout(existing);}

	timers.set(
		windowId,
		setTimeout(() => {
			timers.delete(windowId);
			void persistWindowNow(windowId);
		}, DEBOUNCE_MS),
	);
}

export async function removePersistedWindow(windowId: string, appId?: string): Promise<void> {
	const existing = timers.get(windowId);
	if (existing) {
		clearTimeout(existing);
		timers.delete(windowId);
	}

	// Tab close/refresh: keep WIN geometry on server for restore
	if (isPageUnloading()) {
		return;
	}

	if (!settingManager.isInitialized()) {return;}

	const resolvedAppId = appId ?? useWmStore.getState().windows[windowId]?.appId;
	if (!resolvedAppId) {return;}

	const key = makeWinSettingKey(resolvedAppId, windowId);
	await settingManager.remove('WIN', key);
}

/** Flush debounced WIN writes into SettingManager, then flush API pending. */
export async function flushPendingWindowPersists(): Promise<void> {
	const pendingIds = [...timers.keys()];
	for (const timer of timers.values()) {
		clearTimeout(timer);
	}
	timers.clear();

	await Promise.all(pendingIds.map((id) => persistWindowNow(id)));
	await settingManager.flush();
}

export function clearPersistTimers(): void {
	for (const timer of timers.values()) {
		clearTimeout(timer);
	}
	timers.clear();
}
