import { settingManager } from '@/core/settings/SettingManager';

import { fromPersistedState, isPersistedWindowState, parseWinSettingKey } from './persistWindow';
import { useWmStore } from './useWmStore';

let restoreStarted = false;

/**
 * Мёртвый / альтернативный путь restore (ADR-desktop-ux-sync §9).
 *
 * Канон shell: `restoreFromHistory` → `launchApp` → чтение WIN geometry.
 * Не вызывать из Desktop / основного bootstrap; экспорт оставлен (optional cleanup later).
 *
 * @deprecated Prefer AppManager `restoreFromHistory`.
 */
export async function restoreWindows(): Promise<void> {
	if (restoreStarted || !settingManager.isInitialized()) {return;}
	restoreStarted = true;

	const allWin = await settingManager.getAll('WIN');
	const openWindow = useWmStore.getState().openWindow;

	for (const [key, value] of Object.entries(allWin)) {
		if (!isPersistedWindowState(value)) {continue;}

		const parsed = parseWinSettingKey(key);
		if (!parsed) {continue;}

		const payload = fromPersistedState(parsed.windowId, parsed.appId, value);
		openWindow(payload);
	}
}

export function resetRestoreFlag(): void {
	restoreStarted = false;
}
