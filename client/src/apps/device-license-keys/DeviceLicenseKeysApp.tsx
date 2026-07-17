import { Alert } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { deviceLicenseKeyApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useCanReadDeviceLicenseKey } from '@/features/device/deviceAccess';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function DeviceLicenseKeysApp() {
	useWindowTitle('Ключи лицензий');
	const launchApp = useLaunchDeviceApp();
	const canRead = useCanReadDeviceLicenseKey();
	const pagination = usePaginatedList();

	const listQuery = useQuery({
		queryKey: queryKeys.device.licenseKeys(pagination.listRequest),
		queryFn: () => deviceLicenseKeyApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Название' },
		],
		[],
	);

	const openKey = (id: number) => launchApp('device-license-key', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр ключей лицензий
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Ключи лицензий"
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
		>
			<DataTable
				storageKey="device-license-keys"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openKey(row.id)}
				getRowLabel={(row) => row.name || String(row.id)}
			/>
		</MainListLayout>
	);
}
