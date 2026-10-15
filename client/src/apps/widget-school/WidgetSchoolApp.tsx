import { Box, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { schooltaskCalendarApi, type CalendarEvent } from '@/core/api/endpoints/schooltaskApi';
import { WidgetBody, WidgetSkeleton } from '@/core/desktop/WidgetSurface';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';

export default function WidgetSchoolApp() {
	useWindowTitle('Уроки');
	const [items, setItems] = useState<CalendarEvent[]>([]);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const start = dayjs().startOf('day').format('YYYY-MM-DD HH:mm:ss');
		const end = dayjs().endOf('day').format('YYYY-MM-DD HH:mm:ss');
		void schooltaskCalendarApi
			.teacherEvents({ start, end })
			.then(setItems)
			.catch(() => setItems([]))
			.finally(() => setReady(true));
	}, []);

	return (
		<WidgetBody>
			{!ready ? (
				<WidgetSkeleton />
			) : (
				<Box p={10}>
					<Stack gap={4}>
						{items.length === 0 ? (
							<Text size="xs" c="dimmed">
								На сегодня пусто
							</Text>
						) : (
							items.slice(0, 8).map((item) => (
								<Text key={item.id} size="xs">
									{dayjs(item.start).format('HH:mm')} {item.name}
									{item.files ? ' · файлы' : ''}
								</Text>
							))
						)}
					</Stack>
				</Box>
			)}
		</WidgetBody>
	);
}
