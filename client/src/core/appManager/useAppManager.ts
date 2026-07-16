import { notifications } from '@mantine/notifications';
import { create } from 'zustand';

import { checkHasScope } from '@/core/auth/coreScopes';
import { isRole } from '@/core/auth/coreRoles';
import { settingManager } from '@/core/settings/SettingManager';
import {
	fromPersistedState,
	isPersistedWindowState,
	makeWinSettingKey,
} from '@/core/windowManager/persistWindow';
import { useWmStore } from '@/core/windowManager/useWmStore';
import { resolveWindowLayoutConfig } from '@/core/windowManager/windowLayout';
import { resolveTaskbarGroup } from '@/core/taskbar/taskbarUtils';

import { AppRegistry } from './AppRegistry';
import {
	addToLaunchHistory,
	removeFromLaunchHistory,
	restoreFromHistory as restoreFromHistoryEntries,
} from './launchHistory';
import type { AppManifest, LaunchParams, RunningApp } from './types';

interface AppManagerStore {
	registry: Map<string, AppManifest>;
	running: RunningApp[];
	registerApps: (manifests: AppManifest[]) => void;
	launchApp: (appId: string, params?: LaunchParams) => Promise<string | null>;
	restoreFromHistory: () => Promise<void>;
	removeRunning: (windowId: string) => void;
}

function resolveInstanceKey(manifest: AppManifest, params?: LaunchParams): string {
	if (params?.instanceKey) {return params.instanceKey;}
	if (manifest.instanceKey) {
		return typeof manifest.instanceKey === 'function'
			? manifest.instanceKey(params)
			: manifest.instanceKey;
	}
	return 'default';
}

function buildWindowId(appId: string, instanceKey: string): string {
	return `${appId}__${instanceKey}`;
}

function denyLaunch(message: string): null {
	notifications.show({
		title: 'Access denied',
		message,
		color: 'red',
	});
	return null;
}

async function loadPersistedWindowPayload(appId: string, windowId: string) {
	const key = makeWinSettingKey(appId, windowId);
	const value = await settingManager.get('WIN', key);
	if (!isPersistedWindowState(value)) {return null;}
	return fromPersistedState(windowId, appId, value);
}

let closeCleanupInitialized = false;

function initCloseCleanup(): void {
	if (closeCleanupInitialized) {return;}
	closeCleanupInitialized = true;

	let previousWindows = useWmStore.getState().windows;

	useWmStore.subscribe((state) => {
		const currentWindows = state.windows;
		for (const windowId of Object.keys(previousWindows)) {
			if (!currentWindows[windowId]) {
				const closed = previousWindows[windowId];
				if (closed) {
					useAppManager.getState().removeRunning(windowId);
					void removeFromLaunchHistory(closed.appId, closed.instanceKey);
				}
			}
		}
		previousWindows = currentWindows;
	});
}

export const useAppManager = create<AppManagerStore>((set, get) => ({
	registry: new Map(),
	running: [],

	registerApps: (manifests) => {
		initCloseCleanup();
		for (const manifest of manifests) {
			AppRegistry.register(manifest);
		}
		set({ registry: AppRegistry.getAllMap() });
	},

	launchApp: async (appId, params) => {
		initCloseCleanup();

		const manifest = get().registry.get(appId) ?? AppRegistry.get(appId);
		if (!manifest) {
			notifications.show({
				title: 'App not found',
				message: `Application "${appId}" is not registered.`,
				color: 'red',
			});
			return null;
		}

		if (manifest.requiredRole && !isRole(manifest.requiredRole)) {
			return denyLaunch(`Role "${manifest.requiredRole}" is required.`);
		}

		if (manifest.requiredScope && !checkHasScope(manifest.requiredScope)) {
			return denyLaunch(`Scope "${manifest.requiredScope}" is required.`);
		}

		const instanceKey = resolveInstanceKey(manifest, params);
		const windowId = buildWindowId(appId, instanceKey);

		if (manifest.singleInstance) {
			const existing = get().running.find(
				(entry) => entry.appId === appId && entry.instanceKey === instanceKey,
			);
			if (existing) {
				useWmStore.getState().focusWindow(existing.windowId);
				useWmStore.getState().restoreWindow(existing.windowId);
				return existing.windowId;
			}
		}

		const persisted = settingManager.isInitialized()
			? await loadPersistedWindowPayload(appId, windowId)
			: null;

		const openWindow = useWmStore.getState().openWindow;
		const layout = resolveWindowLayoutConfig(manifest.window);
		let launchX = persisted?.x;
		let launchY = persisted?.y;
		let positionFixed = layout.positionFixed;

		if (
			manifest.window?.positionFixed &&
			typeof manifest.window.positionFixed === 'object'
		) {
			launchX = manifest.window.positionFixed.x;
			launchY = manifest.window.positionFixed.y;
			positionFixed = true;
		}

		const openedId = openWindow({
			id: windowId,
			appId,
			instanceKey,
			title: params?.title ?? persisted?.title ?? manifest.name,
			x: launchX,
			y: launchY,
			width: persisted?.width ?? manifest.defaultSize.width,
			height: persisted?.height ?? manifest.defaultSize.height,
			minimized: persisted?.minimized,
			maximized: persisted?.maximized,
			wmGroup: persisted?.wmGroup ?? manifest.wmGroup ?? 'default',
			wmSort: persisted?.wmSort ?? 0,
			taskbarGroup: resolveTaskbarGroup(manifest),
			dragHandles: manifest.window?.dragHandles,
			dragCancel: manifest.window?.dragCancel,
			resizable: layout.resizable,
			positionFixed,
			autoSize: layout.autoSize,
		});

		set((state) => ({
			running: [
				...state.running.filter((entry) => entry.windowId !== openedId),
				{ windowId: openedId, appId, instanceKey },
			],
		}));

		if (!params?.skipHistory) {
			await addToLaunchHistory(appId, instanceKey);
		}

		return openedId;
	},

	restoreFromHistory: async () => {
		initCloseCleanup();
		await restoreFromHistoryEntries((appId, params) => get().launchApp(appId, params));
	},

	removeRunning: (windowId) => {
		set((state) => ({
			running: state.running.filter((entry) => entry.windowId !== windowId),
		}));
	},
}));
