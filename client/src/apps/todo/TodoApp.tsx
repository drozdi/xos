import {
	ActionIcon,
	Alert,
	Button,
	Card,
	Checkbox,
	Group,
	HoverCard,
	Loader,
	Menu,
	Modal,
	SimpleGrid,
	Stack,
	Text,
	Tooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconClock, IconPalette, IconPlus, IconShare, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { todoApi, type TodoListSummary } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import { useAppContext } from '@/core/context/AppContext';
import { DateTimeField } from '@/core/dates/DateTimeField';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { TodoListEditorModal } from '@/features/todo/TodoListEditorModal';
import { TodoShareModal } from '@/features/todo/TodoShareModal';
import { canUseTodo } from '@/features/todo/todoAccess';
import { TODO_COLORS } from '@/features/todo/todoMarkdown';

function dueTip(dueAt: string | null | undefined): string {
	if (!dueAt) {
		return 'Срок';
	}
	const due = dayjs(dueAt);
	return due.isValid() ? due.format('DD.MM.YYYY HH:mm') : 'Срок';
}

function presetDue(days: number): string {
	return dayjs().add(days, 'day').hour(9).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
}

interface NoteCardActionsProps {
	list: TodoListSummary;
	onShare: (id: number) => void;
	onPatch: (id: number, patch: { color?: string; due_at?: string | null }) => void;
	onManualDue: (id: number, dueAt: string | null) => void;
	onDelete: (id: number) => void;
}

function NoteCardActions({ list, onShare, onPatch, onManualDue, onDelete }: NoteCardActionsProps) {
	const hasColor = /^#[0-9a-fA-F]{6}$/.test(list.color);

	return (
		<Group
			gap={2}
			wrap="nowrap"
			justify='flex-end'
			onMouseDown={(event) => event.stopPropagation()}
			onClick={(event) => event.stopPropagation()}
		>
			{list.is_owner ? (
				<Tooltip label="Поделиться" position="top">
					<ActionIcon
						variant="subtle"
						color="gray"
						aria-label="Поделиться"
						onClick={() => onShare(list.id)}
					>
						<IconShare size={16} />
					</ActionIcon>
				</Tooltip>
			) : null}
			{list.can_write ? (
				<Tooltip label={dueTip(list.due_at)} position="top">
				<span style={{ display: 'inline-flex' }}>
				<Menu position="bottom-start" withinPortal>
					<Menu.Target>
						<ActionIcon variant="subtle" color="gray" aria-label="Срок">
							<IconClock size={16} />
						</ActionIcon>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Item onClick={() => onPatch(list.id, { due_at: presetDue(1) })}>Завтра</Menu.Item>
						<Menu.Item onClick={() => onPatch(list.id, { due_at: presetDue(7) })}>Через неделю</Menu.Item>
						<Menu.Item onClick={() => onManualDue(list.id, list.due_at ?? null)}>Указать вручную</Menu.Item>
						{list.due_at ? (
							<Menu.Item color="red" onClick={() => onPatch(list.id, { due_at: null })}>
								Снять срок
							</Menu.Item>
						) : null}
					</Menu.Dropdown>
				</Menu>
				</span>
				</Tooltip>
			) : null}
			{list.can_write ? (
				<HoverCard position="bottom-start" openDelay={120} closeDelay={200} withinPortal shadow="md">
					<HoverCard.Target>
						<ActionIcon variant="subtle" color="gray" aria-label="Цвет">
							{hasColor ? (
								<span
									style={{
										width: 14,
										height: 14,
										borderRadius: '50%',
										background: list.color,
										border: '1px solid rgba(0,0,0,0.25)',
									}}
								/>
							) : (
								<IconPalette size={16} />
							)}
						</ActionIcon>
					</HoverCard.Target>
					<HoverCard.Dropdown>
						<Group gap={6} wrap="nowrap">
							<button
								type="button"
								aria-label="Без цвета"
								onClick={() => onPatch(list.id, { color: '' })}
								style={{
									width: 22,
									height: 22,
									borderRadius: '50%',
									background: 'transparent',
									border: !hasColor
										? '2px solid var(--mantine-color-text)'
										: '1px dashed var(--mantine-color-default-border)',
									cursor: 'pointer',
								}}
							/>
							{TODO_COLORS.map((c) => (
								<button
									key={c}
									type="button"
									aria-label={`Цвет ${c}`}
									onClick={() => onPatch(list.id, { color: c })}
									style={{
										width: 22,
										height: 22,
										borderRadius: '50%',
										background: c,
										border:
											list.color === c
												? '2px solid var(--mantine-color-text)'
												: '1px solid rgba(0,0,0,0.25)',
										cursor: 'pointer',
									}}
								/>
							))}
						</Group>
					</HoverCard.Dropdown>
				</HoverCard>
			) : null}
			{list.is_owner ? (
				<Tooltip label="Удалить" position="top">
					<ActionIcon
						variant="subtle"
						color="red"
						aria-label="Удалить"
						onClick={() =>
							confirmAction({
								title: 'Удалить заметку?',
								message: 'Заметка будет удалена без возможности восстановления.',
								confirmLabel: 'Удалить',
								cancelLabel: 'Отмена',
								confirmColor: 'red',
								onConfirm: () => onDelete(list.id),
							})
						}
					>
						<IconTrash size={16} />
					</ActionIcon>
				</Tooltip>
			) : null}
		</Group>
	);
}

export default function TodoApp() {
	useWindowTitle('Заметки');
	const { props } = useAppContext();
	const queryClient = useQueryClient();
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [shareId, setShareId] = useState<number | null>(null);
	const [manualDue, setManualDue] = useState<{ id: number; value: string | null } | null>(null);

	useEffect(() => {
		const listId = Number(props?.listId);
		if (Number.isFinite(listId) && listId > 0) {
			setSelectedId(listId);
		}
	}, [props?.listId]);

	const listsQuery = useQuery({
		queryKey: queryKeys.todo.lists,
		queryFn: () => todoApi.lists(),
		enabled: canUseTodo(),
	});
	const shareQuery = useQuery({
		queryKey: queryKeys.todo.list(shareId ?? 0),
		queryFn: () => todoApi.detail(shareId!),
		enabled: shareId !== null,
	});
	const createMutation = useMutation({
		mutationFn: () =>
			todoApi.create({
				title: 'Новая заметка',
				notes_md: '',
			}),
		onSuccess: (list) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			setSelectedId(list.id);
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать список' });
		},
	});
	const patchMutation = useMutation({
		mutationFn: ({ id, ...patch }: { id: number; color?: string; due_at?: string | null }) =>
			todoApi.update(id, patch),
		onSuccess: (_data, variables) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.list(variables.id) });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'dueItems'] });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось сохранить' });
		},
	});
	const deleteMutation = useMutation({
		mutationFn: (id: number) => todoApi.remove(id),
		onSuccess: (_data, id) => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'dueItems'] });
			setSelectedId((current) => (current === id ? null : current));
			setShareId((current) => (current === id ? null : current));
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить' });
		},
	});

	if (!canUseTodo()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Войдите в систему, чтобы пользоваться заметками
			</Alert>
		);
	}

	return (
		<Stack gap={0} h="100%" style={{ minHeight: 0 }}>
			<SimpleGrid
				cols={{ base: 1, xs: 2, sm: 3, md: 4 }}
				spacing="md"
				p="md"
				style={{ flex: 1, minHeight: 0, overflow: 'auto', alignContent: 'start' }}
			>
				{listsQuery.isLoading ? (
					<Group justify="center" py="xl" style={{ gridColumn: '1 / -1' }}>
						<Loader size="sm" />
					</Group>
				) : null}

				<Card
					padding="md"
					radius="md"
					withBorder
					shadow="sm"
					style={{
						cursor: createMutation.isPending ? 'default' : 'pointer',
						minHeight: 120,
					}}
					onClick={() => {
						if (!createMutation.isPending) {
							createMutation.mutate();
						}
					}}
				>
					<Stack gap="xs" h="100%" align="center" justify="center">
						{createMutation.isPending ? <Loader size="sm" /> : <IconPlus size={28} stroke={1.5} />}
						<Text fw={600} size="sm">
							Новая заметка
						</Text>
					</Stack>
				</Card>

				{listsQuery.data?.map((list) => (
					<Card
						key={list.id}
						padding="md"
						radius="md"
						withBorder
						shadow="sm"
						style={{
							cursor: 'pointer',
							minHeight: 120,
							...(list.color ? { borderTopWidth: 3, borderTopColor: list.color } : null),
						}}
						onClick={() => setSelectedId(list.id)}
					>
						<Stack gap="xs" h="100%">
							<Text fw={600} size="sm" lineClamp={2}>
								{list.title}
							</Text>
							{list.due_at ? (
								<Text size="xs" c="dimmed">
									до {dayjs(list.due_at).format('DD.MM.YYYY HH:mm')}
								</Text>
							) : null}
							{list.notes_preview ? (
								<Text size="sm" c="dimmed" lineClamp={3}>
									{list.notes_preview}
								</Text>
							) : null}
							{(list.items_preview ?? []).map((item, index) => (
								<Group key={item.id ?? index} gap="xs" wrap="nowrap" align="flex-start">
									<Checkbox size="xs" checked={item.done} readOnly tabIndex={-1} mt={2} />
									<Text
										size="sm"
										td={item.done ? 'line-through' : undefined}
										c={item.done ? 'dimmed' : undefined}
										lineClamp={2}
									>
										{item.text}
									</Text>
								</Group>
							))}
							{(list.items_count ?? 0) > (list.items_preview?.length ?? 0) ? (
								<Text size="xs" c="dimmed">
									ещё {(list.items_count ?? 0) - (list.items_preview?.length ?? 0)}…
								</Text>
							) : null}
							<Stack justify="space-between" gap='0' mt="auto">
								<Text size="xs" c="dimmed" ta='left'>
									{list.is_owner ? 'Мой' : `От ${list.owner?.alias ?? 'другого'}`}
									{list.can_write ? '' : ' · только просмотр'}
								</Text>
								<NoteCardActions
									list={list}
									onShare={setShareId}
									onPatch={(id, patch) => patchMutation.mutate({ id, ...patch })}
									onManualDue={(id, dueAt) => setManualDue({ id, value: dueAt })}
									onDelete={(id) => deleteMutation.mutate(id)}
								/>
							</Stack>
						</Stack>
					</Card>
				))}
			</SimpleGrid>

			<TodoListEditorModal
				listId={selectedId}
				opened={selectedId !== null}
				onClose={() => setSelectedId(null)}
			/>

			{shareQuery.data ? (
				<TodoShareModal
					list={shareQuery.data}
					opened={shareId !== null}
					onClose={() => setShareId(null)}
					onUpdated={() => {
						void queryClient.invalidateQueries({ queryKey: queryKeys.todo.lists });
						if (shareId !== null) {
							void queryClient.invalidateQueries({ queryKey: queryKeys.todo.list(shareId) });
						}
					}}
				/>
			) : null}

			<Modal
				opened={manualDue !== null}
				onClose={() => setManualDue(null)}
				title="Срок"
				centered
			>
				<Stack>
					<DateTimeField
						label="Дата и время"
						value={manualDue?.value}
						onChange={(value) =>
							setManualDue((current) => (current ? { ...current, value } : current))
						}
					/>
					<Group justify="flex-end">
						<Button
							onClick={() => {
								if (!manualDue) {
									return;
								}
								patchMutation.mutate({ id: manualDue.id, due_at: manualDue.value });
								setManualDue(null);
							}}
						>
							Готово
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Stack>
	);
}
