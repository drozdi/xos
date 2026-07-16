import { Box, Group, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { HKEY_CONFIG_DEFAULTS } from '@/config/defaults';

import { RunningApps } from './RunningApps';
import { StartMenu } from './StartMenu';

export function Taskbar() {
	const [now, setNow] = useState(() => dayjs());

	useEffect(() => {
		const timer = window.setInterval(() => setNow(dayjs()), 30_000);
		return () => window.clearInterval(timer);
	}, []);

	return (
		<Box
			style={{
				width: '100%',
				height: HKEY_CONFIG_DEFAULTS.taskbar.height,
				display: 'flex',
				alignItems: 'center',
				padding: '0 12px',
				backgroundColor: 'var(--mantine-color-dark-7)',
				borderTop: '1px solid var(--mantine-color-dark-5)',
				position: 'relative',
				zIndex: 1000,
			}}
		>
			<Group gap="sm" wrap="nowrap" style={{ width: '100%' }}>
				<StartMenu />
				<RunningApps />
				<Group gap="sm" wrap="nowrap" ml="auto">
					<Text size="xs" c="dimmed">
						{now.format('HH:mm')}
					</Text>
				</Group>
			</Group>
		</Box>
	);
}
