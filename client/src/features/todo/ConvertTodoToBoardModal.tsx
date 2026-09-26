import { Button, Modal, Select, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { boardApi } from '@/core/api/endpoints/boardApi';
import { useAppManager } from '@/core/appManager/useAppManager';
import { queryKeys } from '@/core/api/queryKeys';
import { notifyApiError } from '@/core/api/apiError';

interface ConvertTodoToBoardModalProps {
	opened: boolean;
	onClose: () => void;
	title: string;
	dueAt?: string | null;
	onLinked: (cardId: number, boardId: number) => void;
}

export function ConvertTodoToBoardModal({
	opened,
	onClose,
	title,
	dueAt,
	onLinked,
}: ConvertTodoToBoardModalProps) {
	const launchApp = useAppManager((s) => s.launchApp);
	const [workspaceId, setWorkspaceId] = useState<string | null>(null);
	const [boardId, setBoardId] = useState<string | null>(null);
	const [listId, setListId] = useState<string | null>(null);

	const workspacesQuery = useQuery({
		queryKey: queryKeys.board.workspaces,
		queryFn: () => boardApi.workspaces(),
		enabled: opened,
	});

	const workspaceQuery = useQuery({
		queryKey: queryKeys.board.workspace(Number(workspaceId) || 0),
		queryFn: () => boardApi.workspace(Number(workspaceId)),
		enabled: opened && Boolean(workspaceId),
	});

	const boardQuery = useQuery({
		queryKey: queryKeys.board.board(Number(boardId) || 0),
		queryFn: () => boardApi.board(Number(boardId)),
		enabled: opened && Boolean(boardId),
	});

	const workspaceOptions = useMemo(
		() =>
			(workspacesQuery.data ?? []).map((w) => ({
				value: String(w.id),
				label: w.name || `Workspace #${w.id}`,
			})),
		[workspacesQuery.data],
	);

	const boardOptions = useMemo(
		() =>
			(workspaceQuery.data?.boards ?? []).map((b) => ({
				value: String(b.id),
				label: b.title || `Board #${b.id}`,
			})),
		[workspaceQuery.data],
	);

	const listOptions = useMemo(
		() =>
			(boardQuery.data?.lists ?? []).map((l) => ({
				value: String(l.id),
				label: l.title || `List #${l.id}`,
			})),
		[boardQuery.data],
	);

	const convertMutation = useMutation({
		mutationFn: async () => {
			if (!listId || !boardId) throw new Error('list required');
			const card = await boardApi.createCard(Number(listId), { title: title.trim() || 'Задача' });
			const dueDate = dueAt ? dayjs(dueAt).format('YYYY-MM-DD') : undefined;
			if (dueDate || title) {
				await boardApi.updateCard(card.id, {
					due_date: dueDate ?? null,
					description_md: `Из Todo: ${title}`,
				});
			}
			return { cardId: card.id, boardId: Number(boardId) };
		},
		onSuccess: ({ cardId, boardId: bid }) => {
			notifications.show({ color: 'green', message: 'Карточка создана' });
			onLinked(cardId, bid);
			void launchApp('board', { props: { boardId: bid, cardId } });
			onClose();
		},
		onError: (error) => notifyApiError(error, 'Не удалось создать карточку'),
	});

	return (
		<Modal opened={opened} onClose={onClose} title="В карточку Board" centered>
			<Stack gap="sm">
				<Text size="sm" c="dimmed" lineClamp={2}>
					{title}
				</Text>
				<Select
					label="Workspace"
					data={workspaceOptions}
					value={workspaceId}
					onChange={(v) => {
						setWorkspaceId(v);
						setBoardId(null);
						setListId(null);
					}}
					searchable
					placeholder="Выберите"
				/>
				<Select
					label="Доска"
					data={boardOptions}
					value={boardId}
					onChange={(v) => {
						setBoardId(v);
						setListId(null);
					}}
					disabled={!workspaceId}
					searchable
					placeholder="Выберите"
				/>
				<Select
					label="Колонка"
					data={listOptions}
					value={listId}
					onChange={setListId}
					disabled={!boardId}
					searchable
					placeholder="Выберите"
				/>
				<Button
					loading={convertMutation.isPending}
					disabled={!listId}
					onClick={() => convertMutation.mutate()}
				>
					Создать карточку
				</Button>
			</Stack>
		</Modal>
	);
}
