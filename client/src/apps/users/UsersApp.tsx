import { Alert, Button, Group, Loader, ScrollArea, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { VirtualTable } from '@/components/tables';
import { queryKeys } from '@/core/api/queryKeys';
import { useCoreApi } from '@/core/hooks/useCoreApi';

import type { UserListItem } from '@/types/api.types';

import { fetchUsersList } from './services/usersApi';

export default function UsersApp() {
	const coreApi = useCoreApi();

	const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
		queryKey: queryKeys.main.users({ limit: 50, offset: 1 }),
		queryFn: () => fetchUsersList({ limit: 50, offset: 1 }),
	});

	useEffect(() => {
		coreApi.window.setTitle('Users');
	}, [coreApi]);

	const columns = useMemo(
		() => [
			{ key: 'id', header: 'ID', width: 80, render: (user: UserListItem) => user.id },
			{
				key: 'login',
				header: 'Login',
				render: (user: UserListItem) => user.login,
			},
			{
				key: 'alias',
				header: 'Alias',
				render: (user: UserListItem) => user.alias,
			},
			{ key: 'ou', header: 'OU', render: (user: UserListItem) => user.ou },
			{
				key: 'tutor',
				header: 'Tutor',
				render: (user: UserListItem) => user.tutor,
			},
		],
		[],
	);

	const errorMessage =
		error instanceof Error ? error.message : 'Не удалось загрузить список пользователей';

	return (
		<ScrollArea h="100%" p="md">
			<Group justify="space-between" mb="md">
				<Text fw={600}>Пользователи</Text>
				<Button
					variant="light"
					size="xs"
					onClick={() => void refetch()}
					loading={isFetching && !isLoading}
				>
					Обновить
				</Button>
			</Group>

			{isLoading ? (
				<Group justify="center" py="xl">
					<Loader size="sm" />
				</Group>
			) : isError ? (
				<Alert color="red" title="Ошибка">
					{errorMessage}
				</Alert>
			) : (
				<>
					<Text size="sm" c="dimmed" mb="sm">
						Всего: {data?.total ?? 0}
					</Text>
					<VirtualTable
						columns={columns}
						rows={data?.items ?? []}
						height={360}
						getRowKey={(user) => user.id}
					/>
				</>
			)}
		</ScrollArea>
	);
}
