import { Alert, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { mainGroupApi, type GroupListItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { isRoot } from '@/core/auth/coreRoles';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateMainGroup,
	useCanDeleteMainGroup,
	useCanReadMainGroup,
	useCanUpdateMainGroup,
} from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import { useActiveOuId } from '@/features/main/useActiveOuId';

const ALL_FILTER = -1;

export default function MainGroupsApp() {
	useWindowTitle('Группы');
	const launchMainApp = useLaunchMainApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadMainGroup();
	const canCreate = useCanCreateMainGroup();
	const canUpdate = useCanUpdateMainGroup();
	const canDelete = useCanDeleteMainGroup();
	const root = isRoot();
	const { activeOuId, restored } = useActiveOuId();
	const [ouFilter, setOuFilter] = useState<number>(ALL_FILTER);

	useEffect(() => {
		if (!restored) {
			return;
		}
		if (activeOuId && activeOuId > 0) {
			setOuFilter(activeOuId);
		}
	}, [activeOuId, restored]);

	const activeOu = !root && activeOuId && activeOuId > 0 ? activeOuId : ouFilter;

	const pagination = usePaginatedList({
		filters: { ou: activeOu },
	});

	const filterQuery = useQuery({
		queryKey: queryKeys.main.groupFilter,
		queryFn: () => mainGroupApi.filter(),
		enabled: canRead,
	});

	const listQuery = useQuery({
		queryKey: queryKeys.main.groups(pagination.listRequest),
		queryFn: () => mainGroupApi.list(pagination.listRequest),
		enabled: canRead && restored,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => mainGroupApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.main.groups(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const ouOptions = useMemo(
		() => [
			...(root ? [{ value: String(ALL_FILTER), label: 'Все подразделения' }] : []),
			...(filterQuery.data?.map((ou) => ({
				value: String(ou.id),
				label: ou.name,
			})) ?? []),
		],
		[filterQuery.data, root],
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
			isLoading={!restored || listQuery.isLoading}
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
					value={String(activeOu)}
					onChange={(value) => {
						if (!root) {
							return;
						}
						setOuFilter(value ? Number(value) : ALL_FILTER);
					}}
					disabled={!root}
					searchable
					clearable={false}
				/>
			}
		>
			<DataTable
				storageKey="main-groups"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row: GroupListItem) => openGroup(row.id)}
				onEdit={canUpdate ? (row: GroupListItem) => openGroup(row.id) : undefined}
				onDelete={canDelete ? (row: GroupListItem) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row: GroupListItem) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
