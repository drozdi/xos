import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Checkbox,
	Group,
	Modal,
	ScrollArea,
	Select,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';

import { useAppManager } from '@/core/appManager';
import { DateTimeField } from '@/core/dates/DateTimeField';
import { useWidgetSettingsTick } from '@/core/desktop/useWidgetSettingsTick';
import { WidgetBody, WidgetSkeleton } from '@/core/desktop/WidgetSurface';
import {
	loadRemindersPrefs,
	saveRemindersPrefs,
	type LocalReminder,
} from '@/core/desktop/widgetPrefs';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useShellNotifications } from '@/core/notifications/shellNotificationsStore';

export default function WidgetRemindersApp() {
	useWindowTitle('Напоминания');
	const items = useShellNotifications((s) => s.items);
	const markRead = useShellNotifications((s) => s.markRead);
	const clear = useShellNotifications((s) => s.clear);
	const launchApp = useAppManager((s) => s.launchApp);

	const [reminders, setReminders] = useState<LocalReminder[]>([]);
	const [ready, setReady] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [text, setText] = useState('');
	const [at, setAt] = useState<Date | null>(() => dayjs().add(1, 'hour').toDate());
	const [daily, setDaily] = useState(false);
	const [openApp, setOpenApp] = useState<'calendar' | 'todo' | ''>('');

	useWidgetSettingsTick(useCallback(() => setSettingsOpen(true), []));

	const reloadReminders = useCallback(async () => {
		try {
			const prefs = await loadRemindersPrefs();
			setReminders(prefs.items.filter((i) => !i.firedAt).sort((a, b) => a.at.localeCompare(b.at)));
		} finally {
			setReady(true);
		}
	}, []);

	useEffect(() => {
		void reloadReminders();
	}, [reloadReminders]);

	const addReminder = async () => {
		if (!at || !text.trim()) {
			return;
		}
		const prefs = await loadRemindersPrefs();
		const item: LocalReminder = {
			id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			at: dayjs(at).format('YYYY-MM-DDTHH:mm:ss'),
			text: text.trim(),
			repeat: daily ? 'daily' : 'none',
			...(openApp ? { openApp } : {}),
		};
		await saveRemindersPrefs({ items: [item, ...prefs.items] });
		setText('');
		setAt(dayjs().add(1, 'hour').toDate());
		await reloadReminders();
		setSettingsOpen(false);
	};

	const removeReminder = async (id: string) => {
		const prefs = await loadRemindersPrefs();
		await saveRemindersPrefs({ items: prefs.items.filter((i) => i.id !== id) });
		await reloadReminders();
	};

	const unread = items.filter((i) => !i.read).slice(0, 8);

	return (
		<>
			<WidgetBody key={ready ? 'ready' : 'skeleton'}>
				{!ready ? (
					<WidgetSkeleton />
				) : (
					<Box
						p={10}
						h="100%"
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: 6,
							minHeight: 0,
						}}
					>
						<Group justify="space-between" wrap="nowrap" gap={4}>
							<Text size="xs" fw={600}>
								Лента
							</Text>
							<Badge size="xs" variant="light" color="gray">
								{unread.length}
							</Badge>
						</Group>
						<ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto" offsetScrollbars>
							<Stack gap={4}>
								{unread.length === 0 ? (
									<Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
										Пусто
									</Text>
								) : (
									unread.map((n) => (
										<Box
											key={n.id}
											px={6}
											py={4}
											style={{
												background: 'rgba(255,255,255,0.06)',
												borderRadius: 8,
												cursor: n.launch ? 'pointer' : 'default',
											}}
											onClick={() => {
												markRead(n.id);
												if (n.launch) {
													void launchApp(n.launch.appId, {
														instanceKey: n.launch.instanceKey,
														props: n.launch.props,
													});
												}
											}}
										>
											<Text size="xs" fw={600} lineClamp={1}>
												{n.title}
											</Text>
											{n.body ? (
												<Text size="xs" c="dimmed" lineClamp={1} style={{ opacity: 0.75 }}>
													{n.body}
												</Text>
											) : null}
										</Box>
									))
								)}
							</Stack>
						</ScrollArea>
						{reminders.length > 0 ? (
							<Stack gap={2} style={{ maxHeight: 72, overflow: 'auto' }}>
								{reminders.slice(0, 3).map((r) => (
									<Group key={r.id} justify="space-between" wrap="nowrap" gap={4}>
										<Stack gap={0} style={{ minWidth: 0 }}>
											<Text size="xs" truncate>
												{r.text}
											</Text>
											<Text size="xs" c="dimmed" style={{ opacity: 0.7 }}>
												{dayjs(r.at).format('DD.MM HH:mm')}
												{r.repeat === 'daily' ? ' · ежедневно' : ''}
											</Text>
										</Stack>
										<ActionIcon
											size={18}
											variant="subtle"
											color="gray"
											aria-label="Удалить"
											onClick={() => {
												void removeReminder(r.id);
											}}
										>
											×
										</ActionIcon>
									</Group>
								))}
							</Stack>
						) : null}
						<Group gap={4}>
							<Button size="compact-xs" variant="light" color="gray" onClick={() => setSettingsOpen(true)}>
								+
							</Button>
							<Button size="compact-xs" variant="subtle" color="gray" onClick={() => clear()}>
								Очистить
							</Button>
						</Group>
					</Box>
				)}
			</WidgetBody>
			<Modal
				opened={settingsOpen}
				onClose={() => setSettingsOpen(false)}
				title="Новое напоминание"
				centered
				size="sm"
			>
				<Stack gap="sm">
					<TextInput
						label="Текст"
						placeholder="Позвонить…"
						value={text}
						onChange={(e) => setText(e.currentTarget.value)}
					/>
					<DateTimeField
						label="Когда"
						value={at ? dayjs(at).format('YYYY-MM-DDTHH:mm:ss') : null}
						onChange={(value) => {
							setAt(value ? dayjs(value).toDate() : null);
						}}
					/>
					<Checkbox
						label="Каждый день"
						checked={daily}
						onChange={(event) => setDaily(event.currentTarget.checked)}
					/>
					<Select
						label="Открыть"
						data={[
							{ value: '', label: 'Ленту' },
							{ value: 'calendar', label: 'Календарь' },
							{ value: 'todo', label: 'Задачи' },
						]}
						value={openApp}
						onChange={(value) => setOpenApp(value === 'calendar' || value === 'todo' ? value : '')}
					/>
					<Button onClick={() => void addReminder()} disabled={!text.trim() || !at}>
						Сохранить
					</Button>
				</Stack>
			</Modal>
		</>
	);
}
