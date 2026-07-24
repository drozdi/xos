import { Alert } from 'antd';
import { notifications } from '@/ui/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { devicePropertyApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateDeviceProperty,
	useCanDeleteDeviceProperty,
	useCanReadDeviceProperty,
	useCanUpdateDeviceProperty,
} from '@/features/device/deviceAccess';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function DevicePropertiesApp() {
	useWindowTitle('Свойства');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadDeviceProperty();
	const canCreate = useCanCreateDeviceProperty();
	const canUpdate = useCanUpdateDeviceProperty();
	const canDelete = useCanDeleteDeviceProperty();
	const pagination = usePaginatedList({
		filters: { parent: null, type: null, prototype: null },
	});

	const listQuery = useQuery({
		queryKey: queryKeys.device.properties(pagination.listRequest),
		queryFn: () => devicePropertyApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => devicePropertyApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.properties(pagination.listRequest) });
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

	const openProperty = (id: number) => launchApp('device-property', id);

	if (!canRead) {
		return (
			<Alert type="error" showIcon message="Доступ запрещён" description="Нет прав на просмотр свойств" style={{ margin: 16 }} />
		);
	}

	return (
		<MainListLayout
			title="Свойства"
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
			onCreate={canCreate ? () => openProperty(0) : undefined}
		>
			<DataTable
				storageKey="device-properties"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openProperty(row.id)}
				onEdit={canUpdate ? (row) => openProperty(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
