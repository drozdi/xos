import type { AppManifest } from '@/core/appManager/types';

import { START_MENU_GROUP_LABELS } from './defaults';
import type { StartMenuAppGroup } from './types';

function getGroupLabel(groupId: string): string {
	return START_MENU_GROUP_LABELS[groupId] ?? groupId;
}

export function resolveStartMenuGroup(app: AppManifest): string {
	return app.startMenuGroup ?? app.wmGroup ?? 'default';
}

export function buildAppTree(apps: AppManifest[]): StartMenuAppGroup[] {
	const groups = new Map<string, AppManifest[]>();

	for (const app of apps) {
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
				.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
				.map((app) => ({ id: app.id, name: app.name })),
		}))
		.sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

export function resolvePinnedApps(
	pinnedIds: string[],
	availableApps: AppManifest[],
): AppManifest[] {
	const byId = new Map(availableApps.map((app) => [app.id, app]));
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
