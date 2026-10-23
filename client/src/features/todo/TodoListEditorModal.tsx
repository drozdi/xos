import {
	ActionIcon,
	Button,
	Checkbox,
	Group,
	Loader,
	Modal,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconListCheck, IconPlus, IconTrash } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { todoApi } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';
import { MarkdownPreview } from '@/features/markdown';
import { MarkdownWysiwygEditor } from '@/features/markdown/MarkdownWysiwygEditor';

import type { TodoDraftItem } from './todoMarkdown';

interface TodoListEditorModalProps {
	listId: number | null;
	opened: boolean;
	onClose: () => void;
}

const SAVE_DELAY_MS = 3000;

function emptyItem(): TodoDraftItem {
	return { text: '', done: false, due_at: null };
}

function draftSnapshot(state: {
	title: string;
	notesMd: string;
	items: TodoDraftItem[];
}): string {
	return JSON.stringify({
		title: state.title,
		notesMd: state.notesMd,
		items: state.items
			.filter((item) => item.text.trim() !== '')
			.map((item) => ({
				id: item.id ?? null,
				text: item.text.trim(),
				done: item.done,
				due_at: item.due_at,
				calendar_event_id: item.calendar_event_id ?? null,
				board_card_id: item.board_card_id ?? null,
			})),
	});
}

export function TodoListEditorModal({ listId, opened, onClose }: TodoListEditorModalProps) {
	const queryClient = useQueryClient();
	const hydratedId = useRef<number | null>(null);
	const savedSnapshot = useRef('');
	const saveTimer = useRef<number | null>(null);
	const saveQueue = useRef(Promise.resolve());
	const [title, setTitle] = useState('');
	const [items, setItems] = useState<TodoDraftItem[]>([]);
	const [notesMd, setNotesMd] = useState('');
	const [showChecklist, setShowChecklist] = useState(false);
	const [hydratedFor, setHydratedFor] = useState<number | null>(null);

	const detailQuery = useQuery({
		queryKey: queryKeys.todo.list(listId ?? 0),
		queryFn: () => todoApi.detail(listId!),
		enabled: opened && listId !== null,
	});

	const canWrite = detailQuery.data?.can_write ?? false;
	const latestRef = useRef({ listId, canWrite, title, notesMd, items });
	latestRef.current = { listId, canWrite, title, notesMd, items };

	useEffect(() => {
		if (!opened) {
			hydratedId.current = null;
			setHydratedFor(null);
		}
	}, [opened]);

	useEffect(() => {
		const data = detailQuery.data;
		if (!opened || !data || hydratedId.current === data.id) {
			return;
		}
		hydratedId.current = data.id;
		const nextItems = data.items.map((item) => ({
			id: item.id ?? null,
			text: item.text,
			done: item.done,
			due_at: item.due_at ?? null,
			calendar_event_id: item.calendar_event_id ?? null,
			board_card_id: item.board_card_id ?? null,
		}));
		const nextNotes = data.notes_md ?? '';
		savedSnapshot.current = draftSnapshot({
			title: data.title,
			notesMd: nextNotes,
			items: nextItems,
		});
		setTitle(data.title);
		setNotesMd(nextNotes);
		setItems(nextItems);
		setShowChecklist(nextItems.length > 0);
		setHydratedFor(data.id);
	}, [detailQuery.data, opened]);

	const persist = useCallback(() => {
		const run = async () => {
			const current = latestRef.current;
			if (!current.listId || !current.canWrite) {
				return;
			}
			const snap = draftSnapshot(current);
			if (snap === savedSnapshot.current) {
				return;
			}
			const parsed = JSON.parse(snap) as {
				title: string;
				notesMd: string;
				items: Array<{
					id: number | null;
					text: string;
					done: boolean;
					due_at: string | null;
					calendar_event_id: number | null;
					board_card_id: number | null;
				}>;
			};
			await todoApi.update(current.listId, {
				title: parsed.title,
				notes_md: parsed.notesMd || null,
				items: parsed.items.map((item, position) => ({ ...item, position })),
			});
			savedSnapshot.current = snap;
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
		};
		const next = saveQueue.current.then(run, run);
		saveQueue.current = next.then(
			() => undefined,
			() => undefined,
		);
		return next;
	}, [queryClient]);

	useEffect(() => {
		if (!opened || !canWrite || hydratedFor !== listId) {
			return;
		}
		if (draftSnapshot(latestRef.current) === savedSnapshot.current) {
			return;
		}
		saveTimer.current = window.setTimeout(() => {
			saveTimer.current = null;
			void persist().catch(() => {
				notifications.show({ color: 'red', message: 'Не удалось сохранить' });
			});
		}, SAVE_DELAY_MS);
		return () => {
			if (saveTimer.current !== null) {
				window.clearTimeout(saveTimer.current);
				saveTimer.current = null;
			}
		};
	}, [opened, canWrite, hydratedFor, listId, title, notesMd, items, persist]);

	const closingRef = useRef(false);

	const handleClose = () => {
		if (closingRef.current) {
			return;
		}
		closingRef.current = true;
		if (saveTimer.current !== null) {
			window.clearTimeout(saveTimer.current);
			saveTimer.current = null;
		}
		void persist()
			.catch(() => {
				notifications.show({ color: 'red', message: 'Не удалось сохранить' });
			})
			.finally(() => {
				closingRef.current = false;
				onClose();
			});
	};

	const updateItem = (index: number, patch: Partial<TodoDraftItem>) => {
		setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
	};

	const addItem = () => {
		setShowChecklist(true);
		setItems((prev) => [...prev, emptyItem()]);
	};

	return (
		<Modal
			opened={opened}
			onClose={handleClose}
			title={detailQuery.isLoading ? 'Загрузка…' : title || 'Заметка'}
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
							placeholder="Заголовок"
							value={title}
							disabled={!canWrite}
							onChange={(e) => setTitle(e.currentTarget.value)}
							styles={{
								input: {
									background: 'transparent',
									fontWeight: 600,
									fontSize: 20,
									border: 'none',
									paddingLeft: 0,
								},
							}}
						/>

						{canWrite ? (
							<MarkdownWysiwygEditor
								content={notesMd}
								onChange={setNotesMd}
								formatNonce={0}
								formatCommand={null}
								undoNonce={0}
								redoNonce={0}
								onFormatHandled={() => undefined}
								embedded
								minHeight={160}
							/>
						) : notesMd.trim() ? (
							<MarkdownPreview content={notesMd} />
						) : (
							<Text size="sm" c="dimmed">
								Нет текста
							</Text>
						)}

						{showChecklist ? (
							<Stack gap={6}>
								{items.map((item, index) => (
									<Group key={item.id ?? `new-${index}`} wrap="nowrap" gap="xs">
										<Checkbox
											checked={item.done}
											disabled={!canWrite}
											onChange={(e) => updateItem(index, { done: e.currentTarget.checked })}
										/>
										<TextInput
											value={item.text}
											disabled={!canWrite}
											placeholder="Пункт"
											style={{ flex: 1 }}
											onChange={(e) => updateItem(index, { text: e.currentTarget.value })}
											onKeyDown={(event) => {
												if (event.key === 'Enter' && canWrite && index === items.length - 1) {
													event.preventDefault();
													addItem();
												}
											}}
										/>
										{canWrite ? (
											<ActionIcon
												variant="subtle"
												color="red"
												aria-label="Удалить пункт"
												onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
											>
												<IconTrash size={16} />
											</ActionIcon>
										) : null}
									</Group>
								))}
								{canWrite ? (
									<Button variant="subtle" color="dark" leftSection={<IconPlus size={16} />} onClick={addItem}>
										Пункт
									</Button>
								) : null}
							</Stack>
						) : canWrite ? (
							<Button
								variant="subtle"
								color="dark"
								leftSection={<IconListCheck size={16} />}
								onClick={addItem}
							>
								Чеклист
							</Button>
						) : null}
					</Stack>
				)}
		</Modal>
	);
}
