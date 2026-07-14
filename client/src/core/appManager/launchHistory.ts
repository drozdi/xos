import { settingManager } from '@/core/settings/SettingManager';

import type { LaunchParams } from './types';

const LAUNCH_HISTORY_KEY = 'launchHistory';

export interface LaunchHistoryEntry {
	appId: string;
	instanceKey: string;
	launchedAt: number;
}

export async function getLaunchHistory(): Promise<LaunchHistoryEntry[]> {
	if (!settingManager.isInitialized()) {return [];}

	const stored = await settingManager.get('APP', LAUNCH_HISTORY_KEY);
	if (!Array.isArray(stored)) {return [];}

	return stored.filter(isLaunchHistoryEntry);
}

export async function saveLaunchHistory(history: LaunchHistoryEntry[]): Promise<void> {
	if (!settingManager.isInitialized()) {return;}
	await settingManager.set('APP', LAUNCH_HISTORY_KEY, history);
}

export async function addToLaunchHistory(appId: string, instanceKey: string): Promise<void> {
	const history = await getLaunchHistory();
	const filtered = history.filter(
		(entry) => !(entry.appId === appId && entry.instanceKey === instanceKey),
	);
	filtered.push({ appId, instanceKey, launchedAt: Date.now() });
	await saveLaunchHistory(filtered);
}

export async function removeFromLaunchHistory(appId: string, instanceKey: string): Promise<void> {
	const history = await getLaunchHistory();
	const filtered = history.filter(
		(entry) => !(entry.appId === appId && entry.instanceKey === instanceKey),
	);
	await saveLaunchHistory(filtered);
}

export async function restoreFromHistory(
	launchApp: (appId: string, params?: LaunchParams) => Promise<string | null>,
): Promise<void> {
	const history = await getLaunchHistory();
	for (const entry of history) {
		await launchApp(entry.appId, {
			instanceKey: entry.instanceKey,
			skipHistory: true,
		});
	}
}

function isLaunchHistoryEntry(value: unknown): value is LaunchHistoryEntry {
	if (!value || typeof value !== 'object') {return false;}
	const entry = value as Record<string, unknown>;
	return (
		typeof entry.appId === 'string' &&
		typeof entry.instanceKey === 'string' &&
		typeof entry.launchedAt === 'number'
	);
}
