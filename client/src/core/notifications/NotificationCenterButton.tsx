import { ActionIcon, Badge, Box, Button, Group, Popover, ScrollArea, Stack, Text } from '@mantine/core';
import { IconBell, IconCheck, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useState } from 'react';

import { useAppManager } from '@/core/appManager/useAppManager';
import { useShellNotifications } from '@/core/notifications/shellNotificationsStore';

export function NotificationCenterButton() {
	const [opened, setOpened] = useState(false);
	const launchApp = useAppManager((s) => s.launchApp);
	const items = useShellNotifications((s) => s.items);
	const markRead = useShellNotifications((s) => s.markRead);
	const markAllRead = useShellNotifications((s) => s.markAllRead);
	const clear = useShellNotifications((s) => s.clear);
	const unread = items.filter((i) => !i.read).length;

	return (
		<Popover
			opened={opened}
			onChange={setOpened}
			position="top-end"
			width={320}
			shadow="md"
			withinPortal
		>
			<Popover.Target>
				<ActionIcon
					variant="subtle"
					aria-label="Уведомления"
					onClick={() => setOpened((v) => !v)}
					style={{ position: 'relative' }}
				>
					<IconBell size={18} />
					{unread > 0 ? (
						<Badge
							size="xs"
							circle
							color="red"
							style={{ position: 'absolute', top: 2, right: 2, pointerEvents: 'none' }}
						>
							{unread > 9 ? '9+' : unread}
						</Badge>
					) : null}
				</ActionIcon>
			</Popover.Target>
			<Popover.Dropdown p="xs">
				<Group justify="space-between" mb="xs">
					<Text size="sm" fw={600}>
						Уведомления
					</Text>
					<Group gap={4}>
						<Button size="compact-xs" variant="subtle" leftSection={<IconCheck size={12} />} onClick={markAllRead}>
							Прочитать
						</Button>
						<Button size="compact-xs" variant="subtle" color="red" leftSection={<IconTrash size={12} />} onClick={clear}>
							Очистить
						</Button>
					</Group>
				</Group>
				{items.length === 0 ? (
					<Text size="sm" c="dimmed" ta="center" py="md">
						Пока пусто
					</Text>
				) : (
					<ScrollArea.Autosize mah={280}>
						<Stack gap={6}>
							{items.map((item) => (
								<Box
									key={item.id}
									p="xs"
									style={{
										borderRadius: 6,
										border: '1px solid var(--mantine-color-default-border)',
										opacity: item.read ? 0.65 : 1,
										cursor: item.launch ? 'pointer' : 'default',
										background: item.read
											? 'transparent'
											: 'var(--mantine-color-blue-light)',
									}}
									onClick={() => {
										markRead(item.id);
										if (item.launch) {
											void launchApp(item.launch.appId, {
												instanceKey: item.launch.instanceKey,
												props: item.launch.props,
											});
											setOpened(false);
										}
									}}
								>
									<Text size="sm" fw={500}>
										{item.title}
									</Text>
									{item.body ? (
										<Text size="xs" lineClamp={2}>
											{item.body}
										</Text>
									) : null}
									<Text size="xs" c="dimmed" mt={2}>
										{dayjs(item.createdAt).format('DD.MM HH:mm')}
									</Text>
								</Box>
							))}
						</Stack>
					</ScrollArea.Autosize>
				)}
			</Popover.Dropdown>
		</Popover>
	);
}
