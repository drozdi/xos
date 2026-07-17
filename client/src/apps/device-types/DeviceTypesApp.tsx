import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
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
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: -1, offset: 1 };

export default function DeviceTypesApp() {
	useWindowTitle('Типы устройств');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadDeviceType();
	const canCreate = useCanCreateDeviceType();
	const canUpdate = useCanUpdateDeviceType();
	const canDelete = useCanDeleteDeviceType();

	const listQuery = useQuery({
		queryKey: queryKeys.device.types(listRequest),
		queryFn: () => deviceTypeApi.list(listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deviceTypeApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.types(listRequest) });
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
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр типов
			</Alert>
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
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openType(row.id)}
				onEdit={canUpdate ? (row) => openType(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
