import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { notifyApiError, extractApiErrorMessage } from '@/core/api/apiError';
import { mainOuApi, type OuListItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateMainOu,
	useCanDeleteMainOu,
	useCanReadMainOu,
	useCanUpdateMainOu,
} from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: 50, offset: 1 };

export default function MainOusApp() {
	useWindowTitle('Подразделения');
	const launchMainApp = useLaunchMainApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadMainOu();
	const canCreate = useCanCreateMainOu();
	const canUpdate = useCanUpdateMainOu();
	const canDelete = useCanDeleteMainOu();

	const listQuery = useQuery({
		queryKey: queryKeys.main.ous(listRequest),
		queryFn: () => mainOuApi.list(listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => mainOuApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.main.ous(listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'code' as const, header: 'Код', width: 120 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
			{
				field: 'description' as const,
				header: 'Описание',
				render: (row: OuListItem) => row.description ?? '',
			},
		],
		[],
	);

	const openOu = (id: number) => launchMainApp('main-ou', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр подразделений
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Подразделения"
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
			onCreate={canCreate ? () => openOu(0) : undefined}
		>
			<DataTable
				storageKey="main-ous"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openOu(row.id)}
				onEdit={canUpdate ? (row) => openOu(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				canEdit={canUpdate}
				canDelete={canDelete}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
