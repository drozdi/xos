import { Alert } from 'antd';
import { notifications } from '@/ui/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { deviceTypeApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateDeviceType,
	useCanDeleteDeviceType,
	useCanReadDeviceType,
	useCanUpdateDeviceType,
} from '@/features/device/deviceAccess';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function DeviceTypesApp() {
	useWindowTitle('Типы устройств');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadDeviceType();
	const canCreate = useCanCreateDeviceType();
	const canUpdate = useCanUpdateDeviceType();
	const canDelete = useCanDeleteDeviceType();
	const pagination = usePaginatedList({
		filters: { parent: null, property: null },
	});

	const listQuery = useQuery({
		queryKey: queryKeys.device.types(pagination.listRequest),
		queryFn: () => deviceTypeApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deviceTypeApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.types(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'code' as const, header: 'Код' },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
		],
		[],
	);

	const openType = (id: number) => launchApp('device-type', id);

	if (!canRead) {
		return (
			<Alert type="error" showIcon message="Доступ запрещён" description="Нет прав на просмотр типов" style={{ margin: 16 }} />
		);
	}

	return (
		<MainListLayout
			title="Типы устройств"
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
				storageKey="device-types"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				groupKeys={['group_id']}
				groupedField="group_name"
				groupedHeader="Группа"
				groupedMultiple
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openType(row.id)}
				onEdit={canUpdate ? (row) => openType(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
