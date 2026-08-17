import {
	ActionIcon,
	Alert,
	Button,
	Card,
	Group,
	Loader,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { boardApi } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm/confirmAction';

import { CreateBoardModal } from './CreateBoardModal';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { loadLastBoardId } from './hooks/useBoardFilters';

interface DashboardPageProps {
	onOpenBoard: (boardId: number) => void;
}

export function DashboardPage({ onOpenBoard }: DashboardPageProps) {
	const queryClient = useQueryClient();
	const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
	const [createWorkspaceOpened, setCreateWorkspaceOpened] = useState(false);
	const [createBoardOpened, setCreateBoardOpened] = useState(false);
	const [lastBoardId, setLastBoardId] = useState<number | null>(null);

	useEffect(() => {
		void loadLastBoardId().then(setLastBoardId);
	}, []);

	const workspacesQuery = useQuery({
		queryKey: queryKeys.board.workspaces,
		queryFn: () => boardApi.workspaces(),
	});

	const workspaceDetailQuery = useQuery({
		queryKey: queryKeys.board.workspace(selectedWorkspaceId ?? 0),
		queryFn: () => boardApi.workspace(selectedWorkspaceId!),
		enabled: selectedWorkspaceId !== null,
	});

	useEffect(() => {
		if (workspacesQuery.data?.length && selectedWorkspaceId === null) {
			setSelectedWorkspaceId(workspacesQuery.data[0]!.id);
		}
	}, [workspacesQuery.data, selectedWorkspaceId]);

	const deleteWorkspaceMutation = useMutation({
		mutationFn: (id: number) => boardApi.removeWorkspace(id),
		onSuccess: async (_data, deletedId) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.board.workspaces });
			if (selectedWorkspaceId === deletedId) {
				setSelectedWorkspaceId(null);
			}
			if (lastBoardId !== null) {
				setLastBoardId(null);
			}
			notifications.show({ color: 'green', message: 'Workspace удалён' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить workspace' });
		},
	});

	const deleteBoardMutation = useMutation({
		mutationFn: (id: number) => boardApi.removeBoard(id),
		onSuccess: async (_data, deletedId) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.board.workspaces });
			if (selectedWorkspaceId !== null) {
				await queryClient.invalidateQueries({
					queryKey: queryKeys.board.workspace(selectedWorkspaceId),
				});
			}
			if (lastBoardId === deletedId) {
				setLastBoardId(null);
			}
			notifications.show({ color: 'green', message: 'Доска удалена' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить доску' });
		},
	});

	const handleWorkspaceCreated = (workspaceId: number) => {
		setSelectedWorkspaceId(workspaceId);
	};

	const confirmDeleteWorkspace = (workspaceId: number, name: string) => {
		confirmAction({
			title: 'Удалить workspace?',
			message: `«${name}» и все доски внутри будут удалены без возможности восстановления.`,
			confirmLabel: 'Удалить',
			confirmColor: 'red',
			onConfirm: () => deleteWorkspaceMutation.mutate(workspaceId),
		});
	};

	const confirmDeleteBoard = (boardId: number, title: string) => {
		confirmAction({
			title: 'Удалить доску?',
			message: `«${title}» и все списки с карточками будут удалены.`,
			confirmLabel: 'Удалить',
			confirmColor: 'red',
			onConfirm: () => deleteBoardMutation.mutate(boardId),
		});
	};

	if (workspacesQuery.isLoading) {
		return (
			<Group justify="center" py="xl">
				<Loader size="sm" />
			</Group>
		);
	}

	if (workspacesQuery.isError) {
		return (
			<Alert color="red" title="Ошибка загрузки" m="md">
				Не удалось загрузить workspaces
			</Alert>
		);
	}

	const workspaces = workspacesQuery.data ?? [];
	const selectedWorkspace = workspaceDetailQuery.data;
	const boards = selectedWorkspace?.boards ?? [];
	const canCreateBoard = selectedWorkspace?.permissions.can_create_board ?? false;
	const canDeleteWorkspace = selectedWorkspace?.permissions.can_delete ?? false;

	return (
		<Stack gap={0} h="100%" style={{ minHeight: 0 }}>
			<Group justify="space-between" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
				<Text fw={600}>Доски</Text>
				<Group gap="xs">
					{lastBoardId !== null ? (
						<Button size="xs" variant="default" onClick={() => onOpenBoard(lastBoardId)}>
							Последняя доска
						</Button>
					) : null}
					<Button
						size="xs"
						variant="light"
						leftSection={<IconPlus size={14} />}
						onClick={() => setCreateWorkspaceOpened(true)}
					>
						Workspace
					</Button>
				</Group>
			</Group>

			<Group align="stretch" gap={0} style={{ flex: 1, minHeight: 0 }}>
				<Stack
					gap="xs"
					p="md"
					w={240}
					style={{
						borderRight: '1px solid var(--mantine-color-default-border)',
						minHeight: 0,
					}}
				>
					<Text size="xs" c="dimmed" tt="uppercase" fw={600}>
						Workspaces
					</Text>
					<ScrollArea style={{ flex: 1 }} type="auto">
						<Stack gap="xs">
							{workspaces.length === 0 ? (
								<Text size="sm" c="dimmed">
									Пока нет workspaces
								</Text>
							) : (
								workspaces.map((workspace) => (
									<Card
										key={workspace.id}
										padding="sm"
										radius="md"
										withBorder
										style={{
											cursor: 'pointer',
											backgroundColor:
												selectedWorkspaceId === workspace.id
													? 'var(--mantine-color-blue-light)'
													: undefined,
										}}
										onClick={() => setSelectedWorkspaceId(workspace.id)}
									>
										<Group justify="space-between" wrap="nowrap" gap="xs">
											<Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
												<Text fw={600} size="sm" lineClamp={1}>
													{workspace.name}
												</Text>
												<Text size="xs" c="dimmed">
													{workspace.boards_count ?? 0} досок
												</Text>
											</Stack>
											{workspace.is_owner ? (
												<ActionIcon
													variant="subtle"
													color="red"
													size="sm"
													aria-label="Удалить workspace"
													loading={
														deleteWorkspaceMutation.isPending &&
														deleteWorkspaceMutation.variables === workspace.id
													}
													onClick={(event) => {
														event.stopPropagation();
														confirmDeleteWorkspace(workspace.id, workspace.name);
													}}
												>
													<IconTrash size={14} />
												</ActionIcon>
											) : null}
										</Group>
									</Card>
								))
							)}
						</Stack>
					</ScrollArea>
				</Stack>

				<Stack gap="md" p="md" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
					{selectedWorkspaceId === null ? (
						<Text c="dimmed" ta="center" py="xl">
							Создайте workspace, чтобы начать
						</Text>
					) : workspaceDetailQuery.isLoading ? (
						<Group justify="center" py="xl">
							<Loader size="sm" />
						</Group>
					) : workspaceDetailQuery.isError ? (
						<Alert color="red" title="Ошибка">
							Не удалось загрузить workspace
						</Alert>
					) : (
						<>
							<Group justify="space-between" align="flex-start">
								<Stack gap={4}>
									<Text fw={600}>{selectedWorkspace?.name}</Text>
									{selectedWorkspace?.description ? (
										<Text size="sm" c="dimmed">
											{selectedWorkspace.description}
										</Text>
									) : null}
								</Stack>
								<Group gap="xs">
									{canDeleteWorkspace ? (
										<Button
											size="xs"
											variant="light"
											color="red"
											leftSection={<IconTrash size={14} />}
											loading={deleteWorkspaceMutation.isPending}
											onClick={() =>
												confirmDeleteWorkspace(
													selectedWorkspaceId,
													selectedWorkspace?.name ?? '',
												)
											}
										>
											Удалить workspace
										</Button>
									) : null}
									{canCreateBoard ? (
										<Button
											size="xs"
											leftSection={<IconPlus size={14} />}
											onClick={() => setCreateBoardOpened(true)}
										>
											Доска
										</Button>
									) : null}
								</Group>
							</Group>

							{boards.length === 0 ? (
								<Text c="dimmed" ta="center" py="xl">
									Пока нет досок. Создайте первую.
								</Text>
							) : (
								<SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
									{boards.map((board) => (
										<Card
											key={board.id}
											padding="md"
											radius="md"
											withBorder
											shadow="sm"
											style={{ cursor: 'pointer', minHeight: 100 }}
											onClick={() => onOpenBoard(board.id)}
										>
											<Stack gap="xs" h="100%">
												<Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
													<Text fw={600} size="sm" lineClamp={2} style={{ flex: 1 }}>
														{board.title}
													</Text>
													{board.can_delete ? (
														<ActionIcon
															variant="subtle"
															color="red"
															size="sm"
															aria-label="Удалить доску"
															loading={
																deleteBoardMutation.isPending &&
																deleteBoardMutation.variables === board.id
															}
															onClick={(event) => {
																event.stopPropagation();
																confirmDeleteBoard(board.id, board.title);
															}}
														>
															<IconTrash size={14} />
														</ActionIcon>
													) : null}
												</Group>
												{board.description ? (
													<Text size="sm" c="dimmed" lineClamp={2}>
														{board.description}
													</Text>
												) : null}
												<Text size="xs" c="dimmed" mt="auto">
													{board.visibility === 'workspace' ? 'Workspace' : 'Private'}
												</Text>
											</Stack>
										</Card>
									))}
								</SimpleGrid>
							)}
						</>
					)}
				</Stack>
			</Group>

			<CreateWorkspaceModal
				opened={createWorkspaceOpened}
				onClose={() => setCreateWorkspaceOpened(false)}
				onCreated={handleWorkspaceCreated}
			/>
			<CreateBoardModal
				workspaceId={selectedWorkspaceId}
				opened={createBoardOpened}
				onClose={() => setCreateBoardOpened(false)}
			/>
		</Stack>
	);
}
