import { Box, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

export default function WidgetClockApp() {
	useWindowTitle('Часы');
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		const id = window.setInterval(() => setNow(new Date()), 1000);
		return () => window.clearInterval(id);
	}, []);

	const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
	const date = now.toLocaleDateString('ru-RU', {
		weekday: 'long',
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	});

	return (
		<Box
			h="100%"
			p="md"
			style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				background: 'linear-gradient(160deg, #1b2838 0%, #2c3e50 100%)',
				color: '#f5f7fa',
			}}
		>
			<Stack gap={4} align="center">
				<Text
					fw={600}
					style={{
						fontSize: 42,
						lineHeight: 1,
						fontVariantNumeric: 'tabular-nums',
						letterSpacing: 2,
					}}
				>
					{time}
				</Text>
				<Text size="sm" c="dimmed" tt="capitalize">
					{date}
				</Text>
			</Stack>
		</Box>
	);
}
