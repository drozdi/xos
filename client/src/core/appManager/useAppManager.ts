import { notifications } from '@mantine/notifications';
import { create } from 'zustand';

import {
	attachPageLifecycleListeners,
	isPageUnloading,
} from '@/core/lifecycle/pageLifecycle';
import { isWidgetPageSwitch } from '@/core/desktop/desktopWidgets';
import { getDesktopStatePersister } from '@/core/settings/desktopStatePersister';
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
import { markWidgetClosedInCatalog, syncDesktopWidgetsFromCatalog } from '@/core/desktop/desktopWidgets';

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
	// Explicit multi-instance: Start / «Новое окно» without key → unique window
	if (manifest.singleInstance === false) {
		return crypto.randomUUID();
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

	attachPageLifecycleListeners();

	let previousWindows = useWmStore.getState().windows;

	useWmStore.subscribe((state) => {
		const currentWindows = state.windows;
		for (const windowId of Object.keys(previousWindows)) {
			if (!currentWindows[windowId]) {
				const closed = previousWindows[windowId];
				if (closed) {
					useAppManager.getState().removeRunning(windowId);
					// Tab close/refresh unmounts windows — do not wipe server launchHistory
					if (!isPageUnloading()) {
						const skipCatalog = isWidgetPageSwitch();
						void (async () => {
							await removeFromLaunchHistory(closed.appId, closed.instanceKey);
							if (!skipCatalog) {
								await markWidgetClosedInCatalog(closed.appId, closed.instanceKey);
							}
							// Push closed session to server promptly (not only after 2.5s debounce)
							getDesktopStatePersister().schedule();
							await getDesktopStatePersister().flush();
						})();
					}
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

		if (!AppRegistry.canAccess(manifest)) {
			return denyLaunch('Access denied.');
		}

		const instanceKey = resolveInstanceKey(manifest, params);
		const windowId = buildWindowId(appId, instanceKey);

		const existing = get().running.find(
			(entry) => entry.appId === appId && entry.instanceKey === instanceKey,
		);
		if (existing) {
			useWmStore.getState().focusWindow(existing.windowId);
			useWmStore.getState().restoreWindow(existing.windowId);
			const existingPatch: { title?: string; props?: Record<string, unknown> } = {};
			if (params?.title) {
				existingPatch.title = params.title;
			}
			if (params?.props) {
				existingPatch.props = params.props;
			}
			if (Object.keys(existingPatch).length > 0) {
				useWmStore.getState().updateWindow(existing.windowId, existingPatch);
			}
			return existing.windowId;
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

		const propsDocumentPath =
			typeof params?.props?.documentPath === 'string' ? params.props.documentPath : undefined;
		const documentPath = persisted?.documentPath ?? propsDocumentPath;
		const launchProps = {
			...params?.props,
			...(documentPath ? { documentPath } : {}),
		};
		const isWidget = (manifest.shellRole ?? 'app') === 'widget';
		const openedId = openWindow({
			id: windowId,
			appId,
			instanceKey,
			props: Object.keys(launchProps).length > 0 ? launchProps : undefined,
			documentPath,
			title: params?.title ?? persisted?.title ?? manifest.name,
			x: launchX,
			y: launchY,
			// Widgets stay compact: always manifest size (position may be persisted).
			width: isWidget ? manifest.defaultSize.width : (persisted?.width ?? manifest.defaultSize.width),
			height: isWidget ? manifest.defaultSize.height : (persisted?.height ?? manifest.defaultSize.height),
			minimized: isWidget ? false : persisted?.minimized,
			maximized: isWidget ? false : persisted?.maximized,
			wmGroup: persisted?.wmGroup ?? manifest.wmGroup ?? 'default',
			wmSort: persisted?.wmSort ?? manifest.wmSort ?? 0,
			taskbarGroup: resolveTaskbarGroup(manifest),
			dragHandles: manifest.window?.dragHandles,
			dragCancel: manifest.window?.dragCancel,
			resizable: layout.resizable,
			positionFixed,
			autoSize: layout.autoSize,
			shellRole: manifest.shellRole ?? 'app',
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
		await syncDesktopWidgetsFromCatalog();
	},

	removeRunning: (windowId) => {
		set((state) => ({
			running: state.running.filter((entry) => entry.windowId !== windowId),
		}));
	},
}));
