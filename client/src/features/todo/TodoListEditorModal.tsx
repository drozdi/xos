import {
	Button,
	Checkbox,
	Flex,
	Input,
	Modal,
	Segmented,
	Space,
	Spin,
	Tooltip,
	Typography,
} from 'antd';
import { notifications } from '@/ui/toast';
import { DeleteOutlined, PlusOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { todoApi, type TodoListDetail } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';
import { DateTimeField } from '@/core/dates/DateTimeField';

import { TODO_COLORS, itemsToMarkdown, parseMarkdown, type TodoDraftItem } from './todoMarkdown';
import { TodoShareModal } from './TodoShareModal';

interface TodoListEditorModalProps {
	listId: number | null;
	opened: boolean;
	onClose: () => void;
}

export function TodoListEditorModal({ listId, opened, onClose }: TodoListEditorModalProps) {
	const queryClient = useQueryClient();
	const [title, setTitle] = useState('');
	const [color, setColor] = useState<string>(TODO_COLORS[0]);
	const [items, setItems] = useState<TodoDraftItem[]>([]);
	const [notesMd, setNotesMd] = useState('');
	const [mode, setMode] = useState<'checklist' | 'markdown' | 'preview'>('checklist');
	const [markdown, setMarkdown] = useState('');
	const [shareOpened, setShareOpened] = useState(false);
	const [detail, setDetail] = useState<TodoListDetail | null>(null);

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
				text: item.text,
				done: item.done,
				due_at: item.due_at ?? null,
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
			const payload =
				mode === 'markdown'
					? { title, color, markdown }
					: {
							title,
							color,
							markdown: itemsToMarkdown(items, notesMd),
						};
			return todoApi.update(listId, payload);
		},
		onSuccess: (data) => {
			setDetail(data);
			setMarkdown(data.markdown);
			setItems(
				data.items.map((item) => ({
					text: item.text,
					done: item.done,
					due_at: item.due_at ?? null,
				})),
			);
			setNotesMd(data.notes_md ?? '');
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.list(listId!) });
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
			onClose();
		},
	});

	const canWrite = detail?.can_write ?? false;
	const isOwner = detail?.is_owner ?? false;

	const switchMode = (next: string | number) => {
		const value = String(next) as 'checklist' | 'markdown' | 'preview';
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

	return (
		<>
			<Modal
				open={opened}
				onCancel={onClose}
				title={detailQuery.isLoading ? 'Загрузка…' : title || 'Список'}
				width={720}
				centered
				footer={null}
				destroyOnHidden
			>
				{detailQuery.isLoading ? (
					<Flex justify="center" style={{ padding: '16px 0' }}>
						<Spin size="small" />
					</Flex>
				) : (
					<Flex vertical gap={12}>
						<div>
							<Typography.Text style={{ display: 'block', marginBottom: 4 }}>Название</Typography.Text>
							<Input
								value={title}
								disabled={!canWrite}
								onChange={(e) => setTitle(e.target.value)}
							/>
						</div>
						<Space size={6} wrap>
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
										border: color === c ? '2px solid #333' : '1px solid #bbb',
										cursor: canWrite ? 'pointer' : 'default',
									}}
								/>
							))}
						</Space>

						<Segmented
							value={mode}
							onChange={switchMode}
							options={[
								{ label: 'Список', value: 'checklist' },
								{ label: 'Markdown', value: 'markdown' },
								{ label: 'Просмотр', value: 'preview' },
							]}
						/>

						{mode === 'checklist' ? (
							<Flex vertical gap={8}>
								{items.map((item, index) => (
									<Flex key={index} align="flex-start" gap={8} wrap="nowrap">
										<Checkbox
											style={{ marginTop: 8 }}
											checked={item.done}
											disabled={!canWrite}
											onChange={(e) => updateItem(index, { done: e.target.checked })}
										/>
										<Flex vertical gap={4} style={{ flex: 1 }}>
											<Input
												value={item.text}
												disabled={!canWrite}
												placeholder="Дело…"
												onChange={(e) => updateItem(index, { text: e.target.value })}
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
													});
												}}
											/>
										</Flex>
										{canWrite ? (
											<Button
												type="text"
												danger
												aria-label="Удалить"
												style={{ marginTop: 6 }}
												icon={<DeleteOutlined style={{ fontSize: 16 }} />}
												onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
											/>
										) : null}
									</Flex>
								))}
								{canWrite ? (
									<Button
										icon={<PlusOutlined style={{ fontSize: 16 }} />}
										onClick={() => setItems((prev) => [...prev, { text: '', done: false, due_at: null }])}
									>
										Добавить дело
									</Button>
								) : null}
								<div>
									<Typography.Text style={{ display: 'block', marginBottom: 4 }}>
										Заметки (Markdown)
									</Typography.Text>
									<Input.TextArea
										rows={3}
										value={notesMd}
										disabled={!canWrite}
										onChange={(e) => setNotesMd(e.target.value)}
									/>
								</div>
							</Flex>
						) : null}

						{mode === 'markdown' ? (
							<div>
								<Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 12 }}>
									Чеклист: - [ ] текст | due:YYYY-MM-DD HH:mm. Заметки — после ---
								</Typography.Text>
								<Input.TextArea
									rows={12}
									value={markdown}
									disabled={!canWrite}
									onChange={(e) => setMarkdown(e.target.value)}
								/>
							</div>
						) : null}

						{mode === 'preview' ? (
							<Flex vertical gap={8}>
								{items.length === 0 && !notesMd.trim() ? (
									<Typography.Text type="secondary">Пустой список</Typography.Text>
								) : (
									<>
										{items.map((item, index) => (
											<Flex key={index} gap={8} align="center">
												<Checkbox checked={item.done} disabled />
												<Typography.Text delete={item.done}>{item.text}</Typography.Text>
												{item.due_at ? (
													<Typography.Text type="secondary" style={{ fontSize: 12 }}>
														до {dayjs(item.due_at).format('DD.MM.YYYY HH:mm')}
													</Typography.Text>
												) : null}
											</Flex>
										))}
										{notesMd.trim() ? (
											<div>
												<ReactMarkdown remarkPlugins={[remarkGfm]}>{notesMd}</ReactMarkdown>
											</div>
										) : null}
									</>
								)}
							</Flex>
						) : null}

						<Flex justify="space-between" style={{ marginTop: 12 }}>
							<Space size={8}>
								{isOwner ? (
									<>
										<Button icon={<ShareAltOutlined style={{ fontSize: 16 }} />} onClick={() => setShareOpened(true)}>
											Поделиться
										</Button>
										<Tooltip title="Удалить список">
											<Button
												danger
												aria-label="Удалить"
												loading={deleteMutation.isPending}
												icon={<DeleteOutlined style={{ fontSize: 16 }} />}
												onClick={() => {
													if (window.confirm('Удалить список?')) {
														deleteMutation.mutate();
													}
												}}
											/>
										</Tooltip>
									</>
								) : null}
							</Space>
							<Space size={8}>
								<Button onClick={onClose}>Закрыть</Button>
								{canWrite ? (
									<Button type="primary" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
										Сохранить
									</Button>
								) : null}
							</Space>
						</Flex>
					</Flex>
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
		</>
	);
}
