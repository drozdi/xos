import { Flex, Typography } from 'antd';
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
		<div
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
			<Flex gap="small" wrap="nowrap" align="center" style={{ width: '100%' }}>
				<StartMenu />
				<RunningApps />
				<Flex gap="small" wrap="nowrap" style={{ marginLeft: 'auto' }}>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						{now.format('HH:mm')}
					</Typography.Text>
				</Flex>
			</Flex>
		</div>
	);
}
