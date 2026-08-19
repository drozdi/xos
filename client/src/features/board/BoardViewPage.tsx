import {
	Alert,
	Box,
	Button,
	Group,
	Loader,
	ScrollArea,
	Stack,
	Text,
} from '@mantine/core';
import { IconArrowLeft, IconTags, IconTrash, IconUsers } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
	type BoardDetail,
	type BoardList,
	boardApi,
} from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm/confirmAction';
import { notifications } from '@mantine/notifications';

import { BackgroundPicker } from './BackgroundPicker';
import { BoardColumn } from './BoardColumn';
import { BoardFilters } from './BoardFilters';
import { CardModal } from './CardModal';
import { LabelManageModal } from './LabelManageModal';
import { MemberInviteModal } from './MemberInviteModal';
import { BoardDndContext } from './dnd/BoardDndContext';
import { useBoardDnd } from './dnd/useBoardDnd';
import { saveLastBoardId, useBoardFilters } from './hooks/useBoardFilters';
import { QuickAddList } from './QuickAddList';

interface BoardViewPageProps {
	boardId: number;
	onBack: () => void;
}

function patchBoardLists(
	board: BoardDetail | undefined,
	lists: BoardList[],
): BoardDetail | undefined {
	if (!board) {
		return board;
	}
	return { ...board, lists };
}

export function BoardViewPage({ boardId, onBack }: BoardViewPageProps) {
	const queryClient = useQueryClient();
	const boardQuery = useQuery({
		queryKey: queryKeys.board.board(boardId),
		queryFn: () => boardApi.board(boardId),
	});

	const [lists, setLists] = useState<BoardList[]>([]);
	const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
	const [membersOpened, setMembersOpened] = useState(false);
	const [labelsOpened, setLabelsOpened] = useState(false);

	const { filters, setFilters, matchingIds, restored } = useBoardFilters(boardId);

	useEffect(() => {
		void saveLastBoardId(boardId);
	}, [boardId]);

	useEffect(() => {
		if (boardQuery.data?.lists) {
			setLists(boardQuery.data.lists);
		}
	}, [boardQuery.data?.lists]);

	const invalidateBoard = useCallback(async () => {
		await queryClient.invalidateQueries({ queryKey: queryKeys.board.board(boardId) });
		if (matchingIds !== null) {
			await queryClient.invalidateQueries({ queryKey: ['board', 'filter', boardId] });
		}
	}, [boardId, matchingIds, queryClient]);

	const setBoardLists = useCallback(
		(nextLists: BoardList[]) => {
			setLists(nextLists);
			queryClient.setQueryData<BoardDetail>(queryKeys.board.board(boardId), (current) =>
				patchBoardLists(current, nextLists),
			);
		},
		[boardId, queryClient],
	);

	const createListMutation = useMutation({
		mutationFn: (title: string) => boardApi.createList(boardId, { title }),
		onSuccess: () => invalidateBoard(),
	});

	const updateListMutation = useMutation({
		mutationFn: ({ listId, assigneeId }: { listId: number; assigneeId: number | null }) =>
			boardApi.updateList(listId, { assignee_id: assigneeId }),
		onSuccess: () => invalidateBoard(),
	});

	const deleteListMutation = useMutation({
		mutationFn: (listId: number) => boardApi.deleteList(listId),
		onSuccess: () => invalidateBoard(),
	});

	const createCardMutation = useMutation({
		mutationFn: ({ listId, title }: { listId: number; title: string }) =>
			boardApi.createCard(listId, { title }),
		onSuccess: () => invalidateBoard(),
	});

	const reorderListsMutation = useMutation({
		mutationFn: (orders: Array<{ id: number; order_index: number }>) =>
			boardApi.reorderLists(boardId, orders),
		onSuccess: (board) => {
			setLists(board.lists);
			queryClient.setQueryData(queryKeys.board.board(boardId), board);
		},
		onError: () => invalidateBoard(),
	});

	const moveCardMutation = useMutation({
		mutationFn: ({
			cardId,
			listId,
			position,
		}: {
			cardId: number;
			listId: number;
			position: number;
		}) => boardApi.moveCard(cardId, { list_id: listId, position }),
		onSuccess: () => invalidateBoard(),
		onError: () => invalidateBoard(),
	});

	const updateBackgroundMutation = useMutation({
		mutationFn: (color: string) =>
			boardApi.updateBoard(boardId, { background_type: 'color', background_value: color }),
		onSuccess: (board) => {
			queryClient.setQueryData(queryKeys.board.board(boardId), board);
		},
	});

	const deleteBoardMutation = useMutation({
		mutationFn: () => boardApi.removeBoard(boardId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.board.workspaces });
			const workspaceId = boardQuery.data?.workspace_id;
			if (workspaceId) {
				await queryClient.invalidateQueries({
					queryKey: queryKeys.board.workspace(workspaceId),
				});
			}
			notifications.show({ color: 'green', message: 'Доска удалена' });
			onBack();
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить доску' });
		},
	});

	const canEdit = boardQuery.data?.permissions.can_edit ?? false;
	const canDelete = boardQuery.data?.permissions.can_delete ?? false;
	const canAdmin = boardQuery.data?.permissions.can_admin ?? false;
	const labels = boardQuery.data?.labels ?? [];
	const members = boardQuery.data?.members ?? [];

	const dndMutations = useMemo(
		() => ({
			onReorderLists: async (orders: Array<{ id: number; order_index: number }>) => {
				await reorderListsMutation.mutateAsync(orders);
			},
			onMoveCard: async (cardId: number, listId: number, position: number) => {
				await moveCardMutation.mutateAsync({ cardId, listId, position });
			},
		}),
		[moveCardMutation, reorderListsMutation],
	);

	const dnd = useBoardDnd({
		lists,
		onListsChange: setBoardLists,
		canEdit,
		mutations: dndMutations,
	});

	const backgroundColor =
		boardQuery.data?.background?.type === 'color'
			? boardQuery.data.background.value
			: 'var(--mantine-color-dark-7)';

	if (boardQuery.isLoading || !restored) {
		return (
			<Group justify="center" py="xl">
				<Loader size="sm" />
			</Group>
		);
	}

	if (boardQuery.isError || !boardQuery.data) {
		return (
			<Alert color="red" title="Ошибка загрузки" m="md">
				Не удалось загрузить доску
			</Alert>
		);
	}

	const board = boardQuery.data;

	return (
		<Stack
			gap={0}
			h="100%"
			style={{
				minHeight: 0,
				background: backgroundColor,
			}}
		>
			<Group
				justify="space-between"
				px="md"
				py="sm"
				style={{
					borderBottom: '1px solid var(--mantine-color-default-border)',
					backgroundColor: 'var(--mantine-color-body)',
				}}
			>
				<Group gap="sm">
					<Button
						variant="subtle"
						size="compact-sm"
						leftSection={<IconArrowLeft size={16} />}
						onClick={onBack}
					>
						Назад
					</Button>
					<Text fw={600}>{board.title}</Text>
				</Group>
				<Group gap="sm">
					{board.description ? (
						<Text size="sm" c="dimmed" lineClamp={1} maw={280}>
							{board.description}
						</Text>
					) : null}
					<BackgroundPicker
						value={board.background?.value ?? '#0079bf'}
						onChange={(color) => updateBackgroundMutation.mutate(color)}
						disabled={!canEdit || updateBackgroundMutation.isPending}
					/>
					{canEdit ? (
						<Button
							variant="light"
							size="compact-sm"
							leftSection={<IconTags size={16} />}
							onClick={() => setLabelsOpened(true)}
						>
							Метки
						</Button>
					) : null}
					<Button
						variant="light"
						size="compact-sm"
						leftSection={<IconUsers size={16} />}
						onClick={() => setMembersOpened(true)}
					>
						Участники
					</Button>
					{canDelete ? (
						<Button
							variant="light"
							color="red"
							size="compact-sm"
							leftSection={<IconTrash size={16} />}
							loading={deleteBoardMutation.isPending}
							onClick={() =>
								confirmAction({
									title: 'Удалить доску?',
									message: `«${board.title}» и все списки с карточками будут удалены.`,
									confirmLabel: 'Удалить',
									confirmColor: 'red',
									onConfirm: () => deleteBoardMutation.mutate(),
								})
							}
						>
							Удалить
						</Button>
					) : null}
				</Group>
			</Group>

			<BoardFilters filters={filters} onChange={setFilters} members={members} labels={labels} />

			<Box style={{ flex: 1, minHeight: 0, overflow: 'hidden' }} p="md">
				<BoardDndContext
					sensors={dnd.sensors}
					activeItem={dnd.activeItem}
					listIds={dnd.listIds}
					labels={labels}
					onDragStart={dnd.handleDragStart}
					onDragOver={dnd.handleDragOver}
					onDragEnd={dnd.handleDragEnd}
				>
					<ScrollArea type="auto" offsetScrollbars style={{ height: '100%' }}>
						<Group align="flex-start" wrap="nowrap" gap="md" pb="md">
							{lists.map((list) => (
								<BoardColumn
									key={list.id}
									list={list}
									labels={labels}
									members={members}
									canEdit={canEdit}
									matchingIds={matchingIds}
									onAssigneeChange={(listId, assigneeId) =>
										updateListMutation.mutate({ listId, assigneeId })
									}
									onDeleteList={(listId) => {
										confirmAction({
											title: 'Удалить список',
											message: 'Удалить список и все карточки?',
											confirmColor: 'red',
											onConfirm: () => deleteListMutation.mutate(listId),
										});
									}}
									onAddCard={async (listId, title) => {
										await createCardMutation.mutateAsync({ listId, title });
									}}
									onCardClick={setSelectedCardId}
								/>
							))}
							{canEdit ? (
								<QuickAddList
									onAdd={async (title) => {
										await createListMutation.mutateAsync(title);
									}}
								/>
							) : null}
						</Group>
					</ScrollArea>
				</BoardDndContext>
			</Box>

			<CardModal
				cardId={selectedCardId}
				boardId={boardId}
				labels={labels}
				members={members}
				canEdit={canEdit}
				onClose={() => setSelectedCardId(null)}
			/>

			<LabelManageModal
				boardId={boardId}
				labels={labels}
				opened={labelsOpened}
				canEdit={canEdit}
				onClose={() => setLabelsOpened(false)}
			/>

			<MemberInviteModal
				boardId={boardId}
				opened={membersOpened}
				canAdmin={canAdmin}
				onClose={() => setMembersOpened(false)}
			/>
		</Stack>
	);
}
