import { z } from 'zod';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { settingManager } from '@/core/settings/SettingManager';
import { useWmStore } from '@/core/windowManager/useWmStore';

export const DESKTOP_WIDGETS_SETTING_KEY = 'desktop.widgets';

export const desktopWidgetEntrySchema = z.object({
	appId: z.string().min(1),
	instanceKey: z.string().min(1).default('default'),
	enabled: z.boolean(),
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
	const next = current.filter((e) => !(e.appId === appId && e.instanceKey === instanceKey));
	next.push({ appId, instanceKey, enabled: true });
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
		next.push({ appId, instanceKey, enabled: false });
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

	for (const entry of entries) {
		if (!entry.enabled) {
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
		await writeDesktopWidgets([...current, { appId, instanceKey, enabled: false }]);
		return;
	}
	if (!current[idx]?.enabled) {
		return;
	}
	const next = [...current];
	next[idx] = { appId, instanceKey, enabled: false };
	await writeDesktopWidgets(next);
}
