import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { subDeviceApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateSubDevice,
	useCanDeleteSubDevice,
	useCanReadSubDevice,
	useCanUpdateSubDevice,
} from '@/features/device/deviceAccess';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: -1, offset: 1 };

export default function DeviceSubDevicesApp() {
	useWindowTitle('Комплектующие');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadSubDevice();
	const canCreate = useCanCreateSubDevice();
	const canUpdate = useCanUpdateSubDevice();
	const canDelete = useCanDeleteSubDevice();

	const listQuery = useQuery({
		queryKey: queryKeys.device.subDevices(listRequest),
		queryFn: () => subDeviceApi.list(listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => subDeviceApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.subDevices(listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'type' as const, header: 'Тип' },
			{ field: 'inNo' as const, header: 'Инв. №' },
		],
		[],
	);

	const openSubDevice = (id: number) => launchApp('device-sub-device', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр комплектующих
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Комплектующие"
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
			onCreate={canCreate ? () => openSubDevice(0) : undefined}
		>
			<DataTable
				storageKey="device-sub-devices"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openSubDevice(row.id)}
				onEdit={canUpdate ? (row) => openSubDevice(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || String(row.id)}
			/>
		</MainListLayout>
	);
}
