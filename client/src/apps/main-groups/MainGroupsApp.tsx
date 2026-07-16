import { Alert, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { mainGroupApi, type GroupListItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateMainGroup,
	useCanDeleteMainGroup,
	useCanReadMainGroup,
	useCanUpdateMainGroup,
} from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const ALL_FILTER = -1;

export default function MainGroupsApp() {
	useWindowTitle('Группы');
	const launchMainApp = useLaunchMainApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadMainGroup();
	const canCreate = useCanCreateMainGroup();
	const canUpdate = useCanUpdateMainGroup();
	const canDelete = useCanDeleteMainGroup();
	const [ouFilter, setOuFilter] = useState<number>(ALL_FILTER);

	const listRequest: ListRequest = useMemo(
		() => ({
			limit: 50,
			offset: 1,
			filters: { ou: ouFilter },
		}),
		[ouFilter],
	);

	const filterQuery = useQuery({
		queryKey: queryKeys.main.groupFilter,
		queryFn: () => mainGroupApi.filter(),
		enabled: canRead,
	});

	const listQuery = useQuery({
		queryKey: queryKeys.main.groups(listRequest),
		queryFn: () => mainGroupApi.list(listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => mainGroupApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.main.groups(listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const ouOptions = useMemo(
		() => [
			{ value: String(ALL_FILTER), label: 'Все подразделения' },
			...(filterQuery.data?.map((ou) => ({
				value: String(ou.id),
				label: ou.name,
			})) ?? []),
		],
		[filterQuery.data],
	);

	const columns = useMemo(
		() => [
			{ field: 'code' as const, header: 'Код', width: 120 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'ou' as const, header: 'Подразделение' },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
		],
		[],
	);

	const openGroup = (id: number) => launchMainApp('main-group', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр групп
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Группы"
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
			onCreate={canCreate ? () => openGroup(0) : undefined}
			filters={
				<Select
					label="Подразделение"
					data={ouOptions}
					value={String(ouFilter)}
					onChange={(value) => setOuFilter(value ? Number(value) : ALL_FILTER)}
					searchable
					clearable={false}
				/>
			}
		>
			<DataTable
				storageKey="main-groups"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openGroup(row.id)}
				onEdit={canUpdate ? (row) => openGroup(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				canEdit={canUpdate}
				canDelete={canDelete}
				getRowLabel={(row: GroupListItem) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
