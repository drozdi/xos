import { useCallback } from 'react';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { settingManager } from '@/core/settings/SettingManager';
import { useSetState } from '@/core/settings/hooks';

import { resolvePinnedApps } from './buildAppTree';
import {
	DEFAULT_PINNED_APPS,
	START_MENU_PANEL_HEIGHT,
	START_MENU_PANEL_WIDTH,
} from './defaults';
import { StartMenuAppList } from './StartMenuAppList';
import { StartMenuSidebar } from './StartMenuSidebar';
import { StartMenuTiles } from './StartMenuTiles';
import { START_MENU_SETTING_KEYS } from './types';

interface StartMenuPanelProps {
	onClose: () => void;
}

function persistPinnedIds(next: string[]) {
	if (!settingManager.isInitialized()) {
		return;
	}
	void settingManager.set('USER', START_MENU_SETTING_KEYS.pinnedApps, next);
}

export function StartMenuPanel({ onClose }: StartMenuPanelProps) {
	const availableApps = AppRegistry.getAvailable();
	const [pinnedIds, setPinnedIds] = useSetState<string[]>(
		'USER',
		START_MENU_SETTING_KEYS.pinnedApps,
		DEFAULT_PINNED_APPS,
	);

	const pinnedApps = resolvePinnedApps(pinnedIds, availableApps);
	const pinnedIdSet = new Set(pinnedIds);

	const pinApp = useCallback(
		(appId: string) => {
			setPinnedIds((prev) => {
				if (prev.includes(appId)) {
					return prev;
				}
				const next = [...prev, appId];
				persistPinnedIds(next);
				return next;
			});
		},
		[setPinnedIds],
	);

	const unpinApp = useCallback(
		(appId: string) => {
			setPinnedIds((prev) => {
				const next = prev.filter((id) => id !== appId);
				if (next.length === prev.length) {
					return prev;
				}
				persistPinnedIds(next);
				return next;
			});
		},
		[setPinnedIds],
	);

	return (
		<div
			style={{
				width: START_MENU_PANEL_WIDTH,
				height: START_MENU_PANEL_HEIGHT,
				display: 'flex',
				overflow: 'hidden',
				borderRadius: 8,
				border: '1px solid var(--xos-shell-border)',
				boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)',
				background: 'var(--xos-shell-bg)',
			}}
		>
			<StartMenuSidebar onClose={onClose} />
			<div style={{ display: 'flex', flex: 1, minWidth: 0 }}>
				<StartMenuAppList
					onClose={onClose}
					isPinned={(appId) => pinnedIdSet.has(appId)}
					onPin={pinApp}
				/>
				<StartMenuTiles apps={pinnedApps} onClose={onClose} onUnpin={unpinApp} />
			</div>
		</div>
	);
}
