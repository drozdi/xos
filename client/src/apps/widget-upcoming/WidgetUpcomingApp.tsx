import { Box, ScrollArea, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { useAppManager } from '@/core/appManager';
import { WidgetBody, WidgetSkeleton } from '@/core/desktop/WidgetSurface';
import { loadRemindersPrefs, type LocalReminder } from '@/core/desktop/widgetPrefs';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useShellNotifications } from '@/core/notifications/shellNotificationsStore';

export default function WidgetUpcomingApp() {
	useWindowTitle('Ближайшее');
	const launchApp = useAppManager((s) => s.launchApp);
	const notes = useShellNotifications((s) => s.items);
	const [reminders, setReminders] = useState<LocalReminder[]>([]);
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let alive = true;
		void loadRemindersPrefs()
			.then((prefs) => {
				if (!alive) {
					return;
				}
				setReminders(prefs.items.filter((item) => !item.firedAt).slice(0, 8));
			})
			.finally(() => {
				if (alive) {
					setReady(true);
				}
			});
		return () => {
			alive = false;
		};
	}, []);

	const feed = notes
		.filter((item) => item.kind === 'todo_due' || item.kind === 'board_due' || item.kind === 'inbox')
		.slice(0, 8);

	return (
		<WidgetBody>
			{!ready ? (
				<WidgetSkeleton />
			) : (
				<Box p={10} h="100%" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
					<ScrollArea style={{ flex: 1 }} type="auto" offsetScrollbars>
						<Stack gap={4}>
							{feed.length === 0 && reminders.length === 0 ? (
								<Text size="xs" c="dimmed">
									Пусто
								</Text>
							) : null}
							{feed.map((item) => (
								<Text
									key={item.id}
									size="xs"
									style={{ cursor: item.launch ? 'pointer' : 'default' }}
									onClick={() => {
										if (!item.launch) {
											return;
										}
										void launchApp(item.launch.appId, {
											instanceKey: item.launch.instanceKey,
											props: item.launch.props,
										});
									}}
								>
									{item.title}: {item.body}
								</Text>
							))}
							{reminders.map((item) => (
								<Text
									key={item.id}
									size="xs"
									c="dimmed"
									style={{ cursor: 'pointer' }}
									onClick={() => {
										void launchApp(item.openApp ?? 'widget-reminders', { instanceKey: 'default' });
									}}
								>
									{dayjs(item.at).format('DD.MM HH:mm')} · {item.text}
								</Text>
							))}
						</Stack>
					</ScrollArea>
				</Box>
			)}
		</WidgetBody>
	);
}
