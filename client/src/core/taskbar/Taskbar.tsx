import { Box, Group } from '@mantine/core';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';
import { NotificationCenterButton } from '@/core/notifications';

import { RunningApps } from './RunningApps';
import { StartMenu } from './StartMenu';
import { TaskbarClock } from './TaskbarClock';

export function Taskbar() {
	return (
		<Box
			style={{
				width: '100%',
				height: HKEY_CONFIG_DEFAULTS.taskbar.height,
				display: 'flex',
				alignItems: 'center',
				padding: '0 12px',
				backgroundColor: 'var(--xos-shell-bg)',
				borderTop: '1px solid var(--xos-shell-border)',
				position: 'relative',
				zIndex: 1000,
			}}
		>
			<Group gap="sm" wrap="nowrap" style={{ width: '100%' }}>
				<StartMenu />
				<RunningApps />
				<Group gap="sm" wrap="nowrap" ml="auto">
					<NotificationCenterButton />
					<TaskbarClock />
				</Group>
			</Group>
		</Box>
	);
}
