import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { deviceLicenseApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateDeviceLicense,
	useCanDeleteDeviceLicense,
	useCanReadDeviceLicense,
	useCanUpdateDeviceLicense,
} from '@/features/device/deviceAccess';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: -1, offset: 1 };

export default function DeviceLicensesApp() {
	useWindowTitle('Лицензии');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadDeviceLicense();
	const canCreate = useCanCreateDeviceLicense();
	const canUpdate = useCanUpdateDeviceLicense();
	const canDelete = useCanDeleteDeviceLicense();

	const listQuery = useQuery({
		queryKey: queryKeys.device.licenses(listRequest),
		queryFn: () => deviceLicenseApi.list(listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deviceLicenseApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.licenses(listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'code' as const, header: 'Код' },
			{ field: 'type' as const, header: 'Тип' },
			{ field: 'no' as const, header: 'Номер' },
		],
		[],
	);

	const openLicense = (id: number) => launchApp('device-license', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр лицензий
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Лицензии"
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
			onCreate={canCreate ? () => openLicense(0) : undefined}
		>
			<DataTable
				storageKey="device-licenses"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openLicense(row.id)}
				onEdit={canUpdate ? (row) => openLicense(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.code || row.no || String(row.id)}
			/>
		</MainListLayout>
	);
}
