import type { AppManifest } from '@/core/appManager/types';

import { START_MENU_GROUP_LABELS, START_MENU_GROUP_SORT } from './defaults';
import type { StartMenuAppGroup } from './types';

export function isStartMenuApp(manifest: AppManifest): boolean {
	return manifest.startMenu !== false;
}

function getGroupLabel(groupId: string): string {
	return START_MENU_GROUP_LABELS[groupId] ?? groupId;
}

function getGroupSort(groupId: string): number {
	return START_MENU_GROUP_SORT[groupId] ?? 1000;
}

export function resolveStartMenuSort(app: AppManifest): number {
	return app.startMenuSort ?? app.wmSort ?? 0;
}

export function resolveStartMenuGroup(app: AppManifest): string {
	return app.startMenuGroup ?? app.wmGroup ?? 'default';
}

export function buildAppTree(apps: AppManifest[]): StartMenuAppGroup[] {
	const visibleApps = apps.filter(isStartMenuApp);
	const groups = new Map<string, AppManifest[]>();

	for (const app of visibleApps) {
		const groupId = resolveStartMenuGroup(app);
		const current = groups.get(groupId) ?? [];
		current.push(app);
		groups.set(groupId, current);
	}

	return Array.from(groups.entries())
		.map(([id, groupApps]) => ({
			id,
			label: getGroupLabel(id),
			apps: [...groupApps]
				.sort(
					(a, b) =>
						resolveStartMenuSort(a) - resolveStartMenuSort(b) ||
						a.name.localeCompare(b.name, 'ru'),
				)
				.map((app) => ({
					id: app.id,
					name: app.name,
					borderTop: Boolean(app.startMenuBorderTop),
				})),
		}))
		.sort(
			(a, b) => getGroupSort(a.id) - getGroupSort(b.id) || a.label.localeCompare(b.label, 'ru'),
		);
}

export function resolvePinnedApps(
	pinnedIds: string[],
	availableApps: AppManifest[],
): AppManifest[] {
	const byId = new Map(availableApps.filter(isStartMenuApp).map((app) => [app.id, app]));
	return pinnedIds.map((id) => byId.get(id)).filter((app): app is AppManifest => Boolean(app));
}

export function resolveQuickActions(
	actions: Array<{ id: string; type: 'app' | 'command'; appId?: string; command?: string; label?: string }>,
	availableApps: AppManifest[],
): Array<{ id: string; label: string; type: 'app' | 'command'; appId?: string; command?: string }> {
	const byId = new Map(availableApps.map((app) => [app.id, app]));

	return actions
		.map((action) => {
			if (action.type === 'app') {
				const app = action.appId ? byId.get(action.appId) : undefined;
				if (!app) {
					return null;
				}
				return {
					id: action.id,
					type: 'app' as const,
					appId: app.id,
					label: action.label ?? app.name,
				};
			}

			if (action.type === 'command' && action.command) {
				return {
					id: action.id,
					type: 'command' as const,
					command: action.command,
					label: action.label ?? action.command,
				};
			}

			return null;
		})
		.filter((item): item is NonNullable<typeof item> => item !== null);
}
