import { Box } from '@mantine/core';

import { AppRegistry } from '@/core/appManager/AppRegistry';
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

export function StartMenuPanel({ onClose }: StartMenuPanelProps) {
	const availableApps = AppRegistry.getAvailable();
	const [pinnedIds] = useSetState<string[]>(
		'USER',
		START_MENU_SETTING_KEYS.pinnedApps,
		DEFAULT_PINNED_APPS,
	);

	const pinnedApps = resolvePinnedApps(pinnedIds, availableApps);

	return (
		<Box
			style={{
				width: START_MENU_PANEL_WIDTH,
				height: START_MENU_PANEL_HEIGHT,
				display: 'flex',
				overflow: 'hidden',
				borderRadius: 8,
				border: '1px solid var(--xos-shell-border)',
				boxShadow: 'var(--mantine-shadow-xl)',
				background: 'var(--xos-shell-bg)',
			}}
		>
			<StartMenuSidebar onClose={onClose} />
			<Box style={{ display: 'flex', flex: 1, minWidth: 0 }}>
				<StartMenuAppList onClose={onClose} />
				<StartMenuTiles apps={pinnedApps} onClose={onClose} />
			</Box>
		</Box>
	);
}
