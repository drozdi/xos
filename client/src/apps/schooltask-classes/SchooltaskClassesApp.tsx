import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { schooltaskClassApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateSchooltaskClass,
	useCanDeleteSchooltaskClass,
	useCanReadSchooltaskClass,
	useCanUpdateSchooltaskClass,
} from '@/features/schooltask/schooltaskAccess';
import { useLaunchSchooltaskApp } from '@/features/schooltask/schooltaskAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function SchooltaskClassesApp() {
	useWindowTitle('Классы');
	const launchApp = useLaunchSchooltaskApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadSchooltaskClass();
	const canCreate = useCanCreateSchooltaskClass();
	const canUpdate = useCanUpdateSchooltaskClass();
	const canDelete = useCanDeleteSchooltaskClass();
	const pagination = usePaginatedList();

	const listQuery = useQuery({
		queryKey: queryKeys.schooltask.classes(pagination.listRequest),
		queryFn: () => schooltaskClassApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => schooltaskClassApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.schooltask.classes(pagination.listRequest),
			});
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Класс' },
			{ field: 'tutor' as const, header: 'Классный руководитель' },
		],
		[],
	);

	const openClass = (id: number) => launchApp('schooltask-class', id);

	if (!canRead) {
		return (
			<MainListLayout title="Классы" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red" title="Доступ запрещён">
					Нет прав на просмотр классов
				</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Классы"
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
			onCreate={canCreate ? () => openClass(0) : undefined}
		>
			<DataTable
				storageKey="schooltask-classes"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openClass(row.id)}
				onEdit={canUpdate ? (row) => openClass(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || String(row.id)}
			/>
		</MainListLayout>
	);
}
