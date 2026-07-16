import { Box } from '@mantine/core';

import { AppRegistry } from '@/core/appManager/AppRegistry';
import { useSetState } from '@/core/settings/hooks';

import { resolvePinnedApps, resolveQuickActions } from './buildAppTree';
import {
	DEFAULT_PINNED_APPS,
	DEFAULT_QUICK_ACTIONS,
	START_MENU_PANEL_HEIGHT,
	START_MENU_PANEL_WIDTH,
} from './defaults';
import { StartMenuAppList } from './StartMenuAppList';
import { StartMenuSidebar } from './StartMenuSidebar';
import { StartMenuTiles } from './StartMenuTiles';
import { START_MENU_SETTING_KEYS, type StartMenuQuickAction } from './types';

interface StartMenuPanelProps {
	onClose: () => void;
}

export function StartMenuPanel({ onClose }: StartMenuPanelProps) {
	const availableApps = AppRegistry.getAvailable();
	const [pinnedIds] = useSetState<string[]>(
		'USER',
		START_MENU_SETTING_KEYS.pinnedApps,
		DEFAULT_PINNED_APPS,
	);
	const [quickActionsSetting] = useSetState<StartMenuQuickAction[]>(
		'USER',
		START_MENU_SETTING_KEYS.quickActions,
		DEFAULT_QUICK_ACTIONS,
	);

	const pinnedApps = resolvePinnedApps(pinnedIds, availableApps);
	const quickActions = resolveQuickActions(quickActionsSetting, availableApps).map((action) => {
		if (action.type !== 'app' || !action.appId) {
			return action;
		}
		const manifest = AppRegistry.get(action.appId);
		return {
			...action,
			icon: manifest?.icon,
		};
	});

	return (
		<Box
			style={{
				width: START_MENU_PANEL_WIDTH,
				height: START_MENU_PANEL_HEIGHT,
				display: 'flex',
				overflow: 'hidden',
				borderRadius: 8,
				border: '1px solid var(--mantine-color-dark-5)',
				boxShadow: 'var(--mantine-shadow-xl)',
				background: 'var(--mantine-color-dark-7)',
			}}
		>
			<StartMenuSidebar quickActions={quickActions} onClose={onClose} />
			<Box style={{ display: 'flex', flex: 1, minWidth: 0 }}>
				<StartMenuAppList onClose={onClose} />
				<StartMenuTiles apps={pinnedApps} onClose={onClose} />
			</Box>
		</Box>
	);
}
