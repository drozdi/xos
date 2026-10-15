import { z } from 'zod';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { settingManager } from '@/core/settings/SettingManager';
import { useWmStore } from '@/core/windowManager/useWmStore';

export const DESKTOP_WIDGETS_SETTING_KEY = 'desktop.widgets';
export const DESKTOP_WIDGET_SNAP_KEY = 'desktop.widgetSnap';
export const WIDGET_SNAP_PX = 16;

export function snapWidgetPoint(
	x: number,
	y: number,
	enabled: boolean,
): { x: number; y: number } {
	if (!enabled) {
		return { x, y };
	}
	const grid = WIDGET_SNAP_PX;
	return {
		x: Math.round(x / grid) * grid,
		y: Math.round(y / grid) * grid,
	};
}

export const DESKTOP_PAGE_KEY = 'desktop.page';
export const DESKTOP_PAGE_COUNT = 4;

let widgetPageSwitch = false;

export function isWidgetPageSwitch(): boolean {
	return widgetPageSwitch;
}

export const desktopWidgetEntrySchema = z.object({
	appId: z.string().min(1),
	instanceKey: z.string().min(1).default('default'),
	enabled: z.boolean(),
	page: z.number().int().min(0).max(DESKTOP_PAGE_COUNT - 1).default(0),
});

export const desktopWidgetsCatalogSchema = z.array(desktopWidgetEntrySchema);

export type DesktopWidgetEntry = z.infer<typeof desktopWidgetEntrySchema>;

export function normalizeDesktopWidgets(raw: unknown): DesktopWidgetEntry[] {
	const parsed = desktopWidgetsCatalogSchema.safeParse(raw);
	if (!parsed.success) {
		return [];
	}
	const byKey = new Map<string, DesktopWidgetEntry>();
	for (const entry of parsed.data) {
		const instanceKey = entry.instanceKey || 'default';
		byKey.set(`${entry.appId}__${instanceKey}`, {
			appId: entry.appId,
			instanceKey,
			enabled: entry.enabled,
			page: entry.page ?? 0,
		});
	}
	return Array.from(byKey.values());
}

export async function readDesktopWidgets(): Promise<DesktopWidgetEntry[]> {
	if (!settingManager.isInitialized()) {
		return [];
	}
	const raw = await settingManager.get('USER', DESKTOP_WIDGETS_SETTING_KEY);
	return normalizeDesktopWidgets(raw);
}

export async function writeDesktopWidgets(entries: DesktopWidgetEntry[]): Promise<void> {
	await settingManager.set('USER', DESKTOP_WIDGETS_SETTING_KEY, normalizeDesktopWidgets(entries));
}

export function isWidgetEnabled(entries: DesktopWidgetEntry[], appId: string, instanceKey = 'default'): boolean {
	return entries.some((e) => e.appId === appId && e.instanceKey === instanceKey && e.enabled);
}

/** Enable widget: persist catalog + launch. */
export async function enableDesktopWidget(appId: string, instanceKey = 'default'): Promise<void> {
	const manifest = AppRegistry.get(appId);
	if (!manifest || manifest.shellRole !== 'widget' || !AppRegistry.canAccess(manifest)) {
		return;
	}
	const current = await readDesktopWidgets();
	const page = await readDesktopPage();
	const next = current.filter((e) => !(e.appId === appId && e.instanceKey === instanceKey));
	next.push({ appId, instanceKey, enabled: true, page });
	await writeDesktopWidgets(next);
	const { useAppManager } = await import('@/core/appManager/useAppManager');
	await useAppManager.getState().launchApp(appId, { instanceKey });
}

/** Disable widget: persist catalog + close window. */
export async function disableDesktopWidget(appId: string, instanceKey = 'default'): Promise<void> {
	const current = await readDesktopWidgets();
	const next = current.map((e) =>
		e.appId === appId && e.instanceKey === instanceKey ? { ...e, enabled: false } : e,
	);
	const hasEntry = next.some((e) => e.appId === appId && e.instanceKey === instanceKey);
	if (!hasEntry) {
		next.push({ appId, instanceKey, enabled: false, page: 0 });
	}
	await writeDesktopWidgets(next);

	const windowId = `${appId}__${instanceKey}`;
	if (useWmStore.getState().windows[windowId]) {
		useWmStore.getState().closeWindow(windowId);
	}
}

export async function toggleDesktopWidget(appId: string, instanceKey = 'default'): Promise<boolean> {
	const current = await readDesktopWidgets();
	const enabled = isWidgetEnabled(current, appId, instanceKey);
	if (enabled) {
		await disableDesktopWidget(appId, instanceKey);
		return false;
	}
	await enableDesktopWidget(appId, instanceKey);
	return true;
}

/** After restoreFromHistory: launch enabled widgets that are not open yet. */
export async function syncDesktopWidgetsFromCatalog(): Promise<void> {
	const entries = await readDesktopWidgets();
	const { useAppManager } = await import('@/core/appManager/useAppManager');
	const launchApp = useAppManager.getState().launchApp;
	const windows = useWmStore.getState().windows;

	const page = await readDesktopPage();
	for (const entry of entries) {
		if (!entry.enabled || (entry.page ?? 0) !== page) {
			continue;
		}
		const manifest = AppRegistry.get(entry.appId);
		if (!manifest || manifest.shellRole !== 'widget' || !AppRegistry.canAccess(manifest)) {
			continue;
		}
		const windowId = `${entry.appId}__${entry.instanceKey}`;
		if (windows[windowId]) {
			continue;
		}
		await launchApp(entry.appId, { instanceKey: entry.instanceKey });
	}
}

/** When user closes a widget window, mark it disabled in the catalog. */
export async function markWidgetClosedInCatalog(appId: string, instanceKey: string): Promise<void> {
	if (!AppRegistry.isWidget(appId)) {
		return;
	}
	const current = await readDesktopWidgets();
	const idx = current.findIndex((e) => e.appId === appId && e.instanceKey === instanceKey);
	if (idx === -1) {
		await writeDesktopWidgets([...current, { appId, instanceKey, enabled: false, page: 0 }]);
		return;
	}
	if (!current[idx]?.enabled) {
		return;
	}
	const next = [...current];
	next[idx] = { ...current[idx]!, appId, instanceKey, enabled: false };
	await writeDesktopWidgets(next);
}

export async function readDesktopPage(): Promise<number> {
	if (!settingManager.isInitialized()) {
		return 0;
	}
	const raw = await settingManager.get('USER', DESKTOP_PAGE_KEY);
	const page = typeof raw === 'number' ? raw : Number(raw);
	if (!Number.isInteger(page) || page < 0 || page >= DESKTOP_PAGE_COUNT) {
		return 0;
	}
	return page;
}

/** Switch widget page: hide the previous page without disabling those widgets. */
export async function switchDesktopPage(page: number): Promise<void> {
	const nextPage = Math.min(DESKTOP_PAGE_COUNT - 1, Math.max(0, page));
	await settingManager.set('USER', DESKTOP_PAGE_KEY, nextPage);
	const entries = await readDesktopWidgets();
	widgetPageSwitch = true;
	try {
		for (const entry of entries) {
			if ((entry.page ?? 0) === nextPage) {
				continue;
			}
			const windowId = `${entry.appId}__${entry.instanceKey}`;
			if (useWmStore.getState().windows[windowId]) {
				useWmStore.getState().closeWindow(windowId);
			}
		}
		await syncDesktopWidgetsFromCatalog();
	} finally {
		widgetPageSwitch = false;
	}
}
