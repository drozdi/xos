import {
	ActionIcon,
	Button,
	Checkbox,
	Group,
	Loader,
	Modal,
	SegmentedControl,
	Stack,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendar, IconCalendarPlus, IconLayoutKanban, IconPlus, IconShare, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { calendarApi } from '@/core/api/endpoints/calendarApi';
import { boardApi } from '@/core/api/endpoints/boardApi';
import { todoApi, type TodoListDetail } from '@/core/api/endpoints/todoApi';
import { useAppManager } from '@/core/appManager/useAppManager';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import { DateTimeField } from '@/core/dates/DateTimeField';

import { TODO_COLORS, itemsToMarkdown, parseMarkdown, type TodoDraftItem } from './todoMarkdown';
import { TodoShareModal } from './TodoShareModal';
import { ConvertTodoToBoardModal } from './ConvertTodoToBoardModal';

interface TodoListEditorModalProps {
	listId: number | null;
	opened: boolean;
	onClose: () => void;
}

export function TodoListEditorModal({ listId, opened, onClose }: TodoListEditorModalProps) {
	const queryClient = useQueryClient();
	const launchApp = useAppManager((s) => s.launchApp);
	const [title, setTitle] = useState('');
	const [color, setColor] = useState<string>(TODO_COLORS[0]);
	const [items, setItems] = useState<TodoDraftItem[]>([]);
	const [notesMd, setNotesMd] = useState('');
	const [mode, setMode] = useState<'checklist' | 'markdown' | 'preview'>('checklist');
	const [markdown, setMarkdown] = useState('');
	const [shareOpened, setShareOpened] = useState(false);
	const [detail, setDetail] = useState<TodoListDetail | null>(null);
	const [linkingIndex, setLinkingIndex] = useState<number | null>(null);
	const [boardConvertIndex, setBoardConvertIndex] = useState<number | null>(null);

	const detailQuery = useQuery({
		queryKey: queryKeys.todo.list(listId ?? 0),
		queryFn: () => todoApi.detail(listId!),
		enabled: opened && listId !== null,
	});

	useEffect(() => {
		if (!detailQuery.data) {
			return;
		}
		const data = detailQuery.data;
		setDetail(data);
		setTitle(data.title);
		setColor(data.color);
		setItems(
			data.items.map((item) => ({
				id: item.id ?? null,
				text: item.text,
				done: item.done,
				due_at: item.due_at ?? null,
				calendar_event_id: item.calendar_event_id ?? null,
				board_card_id: item.board_card_id ?? null,
			})),
		);
		setNotesMd(data.notes_md ?? '');
		setMarkdown(data.markdown);
	}, [detailQuery.data]);

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!listId) {
				throw new Error('no list');
			}
			if (mode === 'markdown') {
				return todoApi.update(listId, { title, color, markdown });
			}
			return todoApi.update(listId, {
				title,
				color,
				notes_md: notesMd || null,
				items: items
					.filter((item) => item.text.trim() !== '')
					.map((item, position) => ({
						id: item.id ?? null,
						text: item.text.trim(),
						done: item.done,
						due_at: item.due_at,
						calendar_event_id: item.calendar_event_id ?? null,
						board_card_id: item.board_card_id ?? null,
						position,
					})),
			});
		},
		onSuccess: (data) => {
			setDetail(data);
			setMarkdown(data.markdown);
			setItems(
				data.items.map((item) => ({
					id: item.id ?? null,
					text: item.text,
					done: item.done,
					due_at: item.due_at ?? null,
					calendar_event_id: item.calendar_event_id ?? null,
				})),
			);
			setNotesMd(data.notes_md ?? '');
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.list(listId!) });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'dueItems'] });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
			notifications.show({ color: 'green', message: 'Сохранено' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось сохранить' });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: () => todoApi.remove(listId!),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'dueItems'] });
			onClose();
		},
	});

	const canWrite = detail?.can_write ?? false;
	const isOwner = detail?.is_owner ?? false;

	const switchMode = (next: string) => {
		const value = next as 'checklist' | 'markdown' | 'preview';
		if (mode === 'markdown' && value !== 'markdown') {
			const parsed = parseMarkdown(markdown);
			setItems(parsed.items);
			setNotesMd(parsed.notes_md ?? '');
		}
		if (mode !== 'markdown' && value === 'markdown') {
			setMarkdown(itemsToMarkdown(items, notesMd));
		}
		if (value === 'preview' && mode === 'checklist') {
			setMarkdown(itemsToMarkdown(items, notesMd));
		}
		setMode(value);
	};

	const updateItem = (index: number, patch: Partial<TodoDraftItem>) => {
		setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
	};

	const linkToCalendar = async (index: number) => {
		const item = items[index];
		if (!item?.due_at || !listId || !canWrite) {
			return;
		}
		setLinkingIndex(index);
		try {
			const calendars = await calendarApi.calendars();
			const writable = calendars.find((c) => c.can_write || c.is_owner);
			if (!writable) {
				notifications.show({ color: 'yellow', message: 'Нет календаря с правом записи' });
				return;
			}
			const due = dayjs(item.due_at);
			const allDay = due.hour() === 0 && due.minute() === 0 && due.second() === 0;
			const start = due.format('YYYY-MM-DD HH:mm:ss');
			const end = allDay
				? start
				: due.add(30, 'minute').format('YYYY-MM-DD HH:mm:ss');
			const event = await calendarApi.createEvent({
				calendar_id: writable.id,
				title: item.text.trim() || 'Дело',
				description: `Из списка «${title}»`,
				start_at: start,
				end_at: end,
				all_day: allDay,
			});
			const nextItems = items.map((row, i) =>
				i === index ? { ...row, calendar_event_id: event.id } : row,
			);
			setItems(nextItems);
			await todoApi.update(listId, {
				title,
				color,
				notes_md: notesMd || null,
				items: nextItems
					.filter((row) => row.text.trim() !== '')
					.map((row, position) => ({
						id: row.id ?? null,
						text: row.text.trim(),
						done: row.done,
						due_at: row.due_at,
						calendar_event_id: row.calendar_event_id ?? null,
						position,
					})),
			});
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.list(listId) });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'dueItems'] });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
			notifications.show({ color: 'green', message: 'Событие создано в календаре' });
		} catch {
			notifications.show({ color: 'red', message: 'Не удалось создать событие' });
		} finally {
			setLinkingIndex(null);
		}
	};

	const openInCalendar = (item: TodoDraftItem) => {
		if (!item.due_at) {
			return;
		}
		void launchApp('calendar', {
			props: { focusDate: dayjs(item.due_at).format('YYYY-MM-DD') },
		});
	};

	const openInBoard = async (item: TodoDraftItem) => {
		if (!item.board_card_id) return;
		try {
			let boardId = item.board_id ?? null;
			if (!boardId) {
				const card = await boardApi.card(item.board_card_id);
				boardId = card.board_id ?? null;
			}
			if (!boardId) {
				notifications.show({ color: 'yellow', message: 'Не удалось определить доску' });
				return;
			}
			void launchApp('board', {
				props: { boardId, cardId: item.board_card_id },
			});
		} catch (error) {
			notifications.show({ color: 'red', message: 'Карточка недоступна' });
		}
	};

	return (
		<>
			<Modal
				opened={opened}
				onClose={onClose}
				title={detailQuery.isLoading ? 'Загрузка…' : title || 'Список'}
				size="lg"
				centered
			>
				{detailQuery.isLoading ? (
					<Group justify="center" py="md">
						<Loader size="sm" />
					</Group>
				) : (
					<Stack gap="sm">
						<TextInput
							label="Название"
							value={title}
							disabled={!canWrite}
							onChange={(e) => setTitle(e.currentTarget.value)}
						/>
						<Group gap={6}>
							{TODO_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									disabled={!canWrite}
									aria-label={`Цвет ${c}`}
									onClick={() => setColor(c)}
									style={{
										width: 22,
										height: 22,
										borderRadius: '50%',
										background: c,
										border:
											color === c
												? '2px solid var(--mantine-color-text)'
												: '1px solid var(--mantine-color-default-border)',
										cursor: canWrite ? 'pointer' : 'default',
									}}
								/>
							))}
						</Group>

						<SegmentedControl
							value={mode}
							onChange={switchMode}
							data={[
								{ label: 'Список', value: 'checklist' },
								{ label: 'Markdown', value: 'markdown' },
								{ label: 'Просмотр', value: 'preview' },
							]}
						/>

						{mode === 'checklist' ? (
							<Stack gap="xs">
								{items.map((item, index) => (
									<Group key={index} align="flex-start" wrap="nowrap" gap="xs">
										<Checkbox
											mt={8}
											checked={item.done}
											disabled={!canWrite}
											onChange={(e) => updateItem(index, { done: e.currentTarget.checked })}
										/>
										<Stack gap={4} style={{ flex: 1 }}>
											<TextInput
												value={item.text}
												disabled={!canWrite}
												placeholder="Дело…"
												onChange={(e) => updateItem(index, { text: e.currentTarget.value })}
											/>
											<DateTimeField
												label="Срок"
												value={item.due_at}
												readOnly={!canWrite}
												onChange={(value) => {
													updateItem(index, {
														due_at: value
															? dayjs(value).format('YYYY-MM-DD HH:mm:ss')
															: null,
														...(value ? {} : { calendar_event_id: null }),
													});
												}}
											/>
											{item.due_at ? (
												<Group gap={4}>
													{item.calendar_event_id ? (
														<Text size="xs" c="dimmed">
															Связано с событием #{item.calendar_event_id}
														</Text>
													) : null}
													{canWrite && !item.calendar_event_id ? (
														<Tooltip label="Создать событие в календаре">
															<ActionIcon
																variant="subtle"
																aria-label="В календарь"
																loading={linkingIndex === index}
																onClick={() => void linkToCalendar(index)}
															>
																<IconCalendarPlus size={16} />
															</ActionIcon>
														</Tooltip>
													) : null}
													<Tooltip label="Открыть календарь">
														<ActionIcon
															variant="subtle"
															aria-label="Календарь"
															onClick={() => openInCalendar(item)}
														>
															<IconCalendar size={16} />
														</ActionIcon>
													</Tooltip>
												</Group>
											) : null}
											<Group gap={4}>
												{item.board_card_id ? (
													<>
														<Text size="xs" c="dimmed">
															Карточка #{item.board_card_id}
														</Text>
														<Tooltip label="Открыть на доске">
															<ActionIcon
																variant="subtle"
																aria-label="Board"
																onClick={() => openInBoard(item)}
															>
																<IconLayoutKanban size={16} />
															</ActionIcon>
														</Tooltip>
													</>
												) : canWrite && item.text.trim() ? (
													<Tooltip label="Создать карточку Board">
														<ActionIcon
															variant="subtle"
															aria-label="В Board"
															onClick={() => setBoardConvertIndex(index)}
														>
															<IconLayoutKanban size={16} />
														</ActionIcon>
													</Tooltip>
												) : null}
											</Group>
										</Stack>
										{canWrite ? (
											<ActionIcon
												mt={6}
												variant="subtle"
												color="red"
												aria-label="Удалить"
												onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
											>
												<IconTrash size={16} />
											</ActionIcon>
										) : null}
									</Group>
								))}
								{canWrite ? (
									<Button
										variant="light"
										leftSection={<IconPlus size={16} />}
										onClick={() => setItems((prev) => [...prev, { text: '', done: false, due_at: null }])}
									>
										Добавить дело
									</Button>
								) : null}
								<Textarea
									label="Заметки (Markdown)"
									minRows={3}
									value={notesMd}
									disabled={!canWrite}
									onChange={(e) => setNotesMd(e.currentTarget.value)}
								/>
							</Stack>
						) : null}

						{mode === 'markdown' ? (
							<Textarea
								minRows={12}
								autosize
								value={markdown}
								disabled={!canWrite}
								description="Чеклист: - [ ] текст | due:YYYY-MM-DD HH:mm. Заметки — после ---"
								onChange={(e) => setMarkdown(e.currentTarget.value)}
							/>
						) : null}

						{mode === 'preview' ? (
							<Stack gap="xs">
								{items.length === 0 && !notesMd.trim() ? (
									<Text c="dimmed">Пустой список</Text>
								) : (
									<>
										{items.map((item, index) => (
											<Group key={index} gap="xs">
												<Checkbox checked={item.done} readOnly />
												<Text td={item.done ? 'line-through' : undefined}>{item.text}</Text>
												{item.due_at ? (
													<Text size="xs" c="dimmed">
														до {dayjs(item.due_at).format('DD.MM.YYYY HH:mm')}
													</Text>
												) : null}
											</Group>
										))}
										{notesMd.trim() ? (
											<div>
												<ReactMarkdown remarkPlugins={[remarkGfm]}>{notesMd}</ReactMarkdown>
											</div>
										) : null}
									</>
								)}
							</Stack>
						) : null}

						<Group justify="space-between" mt="sm">
							<Group gap="xs">
								{isOwner ? (
									<>
										<Button
											variant="light"
											leftSection={<IconShare size={16} />}
											onClick={() => setShareOpened(true)}
										>
											Поделиться
										</Button>
										<Tooltip label="Удалить список">
											<ActionIcon
												variant="light"
												color="red"
												aria-label="Удалить"
												loading={deleteMutation.isPending}
												onClick={() => {
													confirmAction({
														title: 'Удалить список?',
														message:
															'Список и все дела будут удалены без возможности восстановления.',
														confirmLabel: 'Удалить',
														cancelLabel: 'Отмена',
														confirmColor: 'red',
														onConfirm: () => deleteMutation.mutate(),
													});
												}}
											>
												<IconTrash size={16} />
											</ActionIcon>
										</Tooltip>
									</>
								) : null}
							</Group>
							<Group gap="xs">
								<Button variant="default" onClick={onClose}>
									Закрыть
								</Button>
								{canWrite ? (
									<Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
										Сохранить
									</Button>
								) : null}
							</Group>
						</Group>
					</Stack>
				)}
			</Modal>

			{detail && isOwner ? (
				<TodoShareModal
					list={detail}
					opened={shareOpened}
					onClose={() => setShareOpened(false)}
					onUpdated={(next) => setDetail(next)}
				/>
			) : null}

			{boardConvertIndex !== null && items[boardConvertIndex] ? (
				<ConvertTodoToBoardModal
					opened
					onClose={() => setBoardConvertIndex(null)}
					title={items[boardConvertIndex]!.text}
					dueAt={items[boardConvertIndex]!.due_at}
					onLinked={(cardId, boardId) => {
						const index = boardConvertIndex;
						const nextItems = items.map((row, i) =>
							i === index ? { ...row, board_card_id: cardId, board_id: boardId } : row,
						);
						setItems(nextItems);
						if (listId) {
							void todoApi.update(listId, {
								title,
								color,
								notes_md: notesMd || null,
								items: nextItems
									.filter((row) => row.text.trim() !== '')
									.map((row, position) => ({
										id: row.id ?? null,
										text: row.text.trim(),
										done: row.done,
										due_at: row.due_at,
										calendar_event_id: row.calendar_event_id ?? null,
										board_card_id: row.board_card_id ?? null,
										position,
									})),
							});
						}
					}}
				/>
			) : null}
		</>
	);
}
