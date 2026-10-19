import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockTypeApi } from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateIblockType,
	useCanDeleteIblockType,
	useCanReadIblockType,
	useCanUpdateIblockType,
} from '@/features/iblock/iblockAccess';
import { useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function IblockTypesApp() {
	useWindowTitle('Типы инфоблоков');
	const launchApp = useLaunchIblockApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadIblockType();
	const canCreate = useCanCreateIblockType();
	const canUpdate = useCanUpdateIblockType();
	const canDelete = useCanDeleteIblockType();
	const pagination = usePaginatedList({ filters: {} });

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.types(pagination.listRequest),
		queryFn: () => iblockTypeApi.list(pagination.listRequest),
		placeholderData: keepPreviousData,
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockTypeApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.iblock.types(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'code' as const, header: 'Код' },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
			{ field: 'active' as const, header: 'Активен', width: 90 },
		],
		[],
	);

	const openType = (id: number) => launchApp('iblock-type', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр типов
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Типы инфоблоков"
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
			onCreate={canCreate ? () => openType(0) : undefined}
		>
			<DataTable
				storageKey="iblock-types"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openType(row.id)}
				onEdit={canUpdate ? (row) => openType(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
