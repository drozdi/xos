import { Typography } from 'antd';

import type { WindowState } from './types';

interface DemoWindowContentProps {
	window: WindowState;
}

export function DemoWindowContent({ window }: DemoWindowContentProps) {
	return (
		<Typography.Text type="secondary" style={{ fontSize: 13 }}>
			Demo content — appId: <strong>{window.appId}</strong>, title: <strong>{window.title}</strong>
		</Typography.Text>
	);
}
