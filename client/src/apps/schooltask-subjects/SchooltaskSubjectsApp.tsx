import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { schooltaskSubjectApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateSchooltaskSubject,
	useCanDeleteSchooltaskSubject,
	useCanReadSchooltaskSubject,
	useCanUpdateSchooltaskSubject,
} from '@/features/schooltask/schooltaskAccess';
import { useLaunchSchooltaskApp } from '@/features/schooltask/schooltaskAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function SchooltaskSubjectsApp() {
	useWindowTitle('Предметы');
	const launchApp = useLaunchSchooltaskApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadSchooltaskSubject();
	const canCreate = useCanCreateSchooltaskSubject();
	const canUpdate = useCanUpdateSchooltaskSubject();
	const canDelete = useCanDeleteSchooltaskSubject();
	const pagination = usePaginatedList({
		sortBy: [{ key: 'sort', order: 'ASC' }],
	});

	const listQuery = useQuery({
		queryKey: queryKeys.schooltask.subjects(pagination.listRequest),
		queryFn: () => schooltaskSubjectApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => schooltaskSubjectApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.schooltask.subjects(pagination.listRequest),
			});
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
		],
		[],
	);

	const openSubject = (id: number) => launchApp('schooltask-subject', id);

	if (!canRead) {
		return (
			<MainListLayout title="Предметы" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red" title="Доступ запрещён">
					Нет прав на просмотр предметов
				</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Предметы"
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
			onCreate={canCreate ? () => openSubject(0) : undefined}
		>
			<DataTable
				storageKey="schooltask-subjects"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openSubject(row.id)}
				onEdit={canUpdate ? (row) => openSubject(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || String(row.id)}
			/>
		</MainListLayout>
	);
}
