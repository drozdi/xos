import {
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
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { boardApi } from '@/core/api/endpoints/boardApi';
import { queryKeys } from '@/core/api/queryKeys';

import { CreateBoardModal } from './CreateBoardModal';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { loadLastBoardId } from './hooks/useBoardFilters';

interface DashboardPageProps {
	onOpenBoard: (boardId: number) => void;
}

export function DashboardPage({ onOpenBoard }: DashboardPageProps) {
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

	const handleWorkspaceCreated = (workspaceId: number) => {
		setSelectedWorkspaceId(workspaceId);
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
										<Stack gap={2}>
											<Text fw={600} size="sm" lineClamp={1}>
												{workspace.name}
											</Text>
											<Text size="xs" c="dimmed">
												{workspace.boards_count ?? 0} досок
											</Text>
										</Stack>
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
											<Stack gap="xs">
												<Text fw={600} size="sm" lineClamp={2}>
													{board.title}
												</Text>
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
