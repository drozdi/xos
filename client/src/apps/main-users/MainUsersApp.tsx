import { Alert, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { mainUserApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateMainUser,
	useCanDeleteMainUser,
	useCanReadMainUser,
	useCanUpdateMainUser,
} from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';

const ALL_FILTER = -1;

export default function MainUsersApp() {
	useWindowTitle('Пользователи');
	const launchMainApp = useLaunchMainApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadMainUser();
	const canCreate = useCanCreateMainUser();
	const canUpdate = useCanUpdateMainUser();
	const canDelete = useCanDeleteMainUser();
	const [ouFilter, setOuFilter] = useState<number>(ALL_FILTER);
	const [groupFilter, setGroupFilter] = useState<number>(ALL_FILTER);

	const pagination = usePaginatedList({
		sortBy: [{ key: 'login', order: 'ASC' }],
		filters: { ou: ouFilter, group: groupFilter },
	});

	const filterQuery = useQuery({
		queryKey: queryKeys.main.userFilter,
		queryFn: () => mainUserApi.filter(),
	});

	const listQuery = useQuery({
		queryKey: queryKeys.main.users(pagination.listRequest),
		queryFn: () => mainUserApi.list(pagination.listRequest),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => mainUserApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.main.users(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const ouOptions = useMemo(
		() => [
			{ value: String(ALL_FILTER), label: 'Все подразделения' },
			...(filterQuery.data?.map((ou) => ({
				value: String(ou.value),
				label: ou.title,
			})) ?? []),
		],
		[filterQuery.data],
	);

	const groupOptions = useMemo(() => {
		const options = [{ value: String(ALL_FILTER), label: 'Все группы' }];
		if (ouFilter === ALL_FILTER) {
			return options;
		}
		const ou = filterQuery.data?.find((item) => item.value === ouFilter);
		for (const group of ou?.groups ?? []) {
			if (group.type === 'divider' || group.type === 'subheader') {
				continue;
			}
			options.push({
				value: String(group.value),
				label: group.title,
			});
		}
		return options;
	}, [filterQuery.data, ouFilter]);

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'login' as const, header: 'Логин' },
			{ field: 'alias' as const, header: 'Псевдоним' },
			{ field: 'ou' as const, header: 'Подразделение' },
			{ field: 'tutor' as const, header: 'Руководитель' },
		],
		[],
	);

	const openUser = (id: number) => launchMainApp('main-user', id);

	if (!canRead) {
		return (
			<MainListLayout title="Пользователи" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red" title="Доступ запрещён">
					Нет прав на просмотр пользователей
				</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Пользователи"
			total={listQuery.data?.total}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить данные')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={canCreate ? () => openUser(0) : undefined}
			createLabel="Создать"
			filters={
				<Stack gap="xs">
					<Select
						label="Подразделение"
						data={ouOptions}
						value={String(ouFilter)}
						onChange={(value) => {
							setOuFilter(value ? Number(value) : ALL_FILTER);
							setGroupFilter(ALL_FILTER);
						}}
						searchable
						clearable={false}
					/>
					<Select
						label="Группа"
						data={groupOptions}
						value={String(groupFilter)}
						onChange={(value) => setGroupFilter(value ? Number(value) : ALL_FILTER)}
						disabled={ouFilter === ALL_FILTER}
						searchable
						clearable={false}
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="main-users"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openUser(row.id)}
				onEdit={canUpdate ? (row) => openUser(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.login || row.alias}
			/>
		</MainListLayout>
	);
}
