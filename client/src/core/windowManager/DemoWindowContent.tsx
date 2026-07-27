import { Text } from '@mantine/core';

import type { WindowState } from './types';

interface DemoWindowContentProps {
	window: WindowState;
}

export function DemoWindowContent({ window }: DemoWindowContentProps) {
	return (
		<Text size="sm" c="dimmed">
			Demo content — appId: <strong>{window.appId}</strong>, title: <strong>{window.title}</strong>
		</Text>
	);
}
