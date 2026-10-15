import { Box, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { useAppManager } from '@/core/appManager';
import { userDataApi } from '@/core/api/endpoints/userData';
import { todoApi } from '@/core/api/endpoints/todoApi';
import { WidgetBody, WidgetSkeleton } from '@/core/desktop/WidgetSurface';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { HABITS_STREAK_CODE } from '@/features/habits/habitUtils';

export default function WidgetTodayApp() {
	useWindowTitle('Сегодня');
	const launchApp = useAppManager((s) => s.launchApp);
	const [lines, setLines] = useState<string[]>([]);
	const [streak, setStreak] = useState(0);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		void (async () => {
			try {
				const start = dayjs().startOf('day').format('YYYY-MM-DDTHH:mm:ss');
				const end = dayjs().endOf('day').format('YYYY-MM-DDTHH:mm:ss');
				const due = await todoApi.dueItems(start, end);
				setLines(due.filter((item) => !item.done).slice(0, 6).map((item) => item.text || 'Задача'));
			} catch {
				setLines([]);
			}
			try {
				const row = await userDataApi.getOptional(HABITS_STREAK_CODE);
				const value = row?.value;
				if (value && typeof value === 'object') {
					const numbers = Object.values(value as Record<string, unknown>).filter(
						(item): item is number => typeof item === 'number',
					);
					setStreak(numbers.reduce((max, item) => Math.max(max, item), 0));
				}
			} catch {
				setStreak(0);
			}
			setReady(true);
		})();
	}, []);

	return (
		<WidgetBody>
			{!ready ? (
				<WidgetSkeleton />
			) : (
				<Box p={10}>
					<Stack gap={4}>
						<Text
							size="xs"
							fw={600}
							style={{ cursor: 'pointer' }}
							onClick={() => void launchApp('habits')}
						>
							Серия привычек: {streak}
						</Text>
						{lines.length === 0 ? (
							<Text size="xs" c="dimmed">
								На сегодня задач нет
							</Text>
						) : (
							lines.map((line) => (
								<Text
									key={line}
									size="xs"
									style={{ cursor: 'pointer' }}
									onClick={() => void launchApp('todo')}
								>
									{line}
								</Text>
							))
						)}
					</Stack>
				</Box>
			)}
		</WidgetBody>
	);
}
