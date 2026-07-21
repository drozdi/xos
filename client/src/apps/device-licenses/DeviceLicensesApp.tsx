import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
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

type LicenseListItem = {
	id: number;
	license_id?: number | null;
	code: string;
	type?: string;
	display_name: string;
	items?: LicenseListItem[];
};

function isLicenseSoftwareItem(item: { id: number; license_id?: number | null }) {
	return item.license_id != null && item.id !== item.license_id;
}

export default function DeviceLicensesApp() {
	useWindowTitle('Лицензии');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadDeviceLicense();
	const canCreate = useCanCreateDeviceLicense();
	const canUpdate = useCanUpdateDeviceLicense();
	const canDelete = useCanDeleteDeviceLicense();
	const pagination = usePaginatedList({
		filters: { 'type!': 'OEM' },
	});

	const listQuery = useQuery({
		queryKey: queryKeys.device.licenses(pagination.listRequest),
		queryFn: () => deviceLicenseApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deviceLicenseApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.licenses(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const tableData = useMemo<LicenseListItem[]>(() => {
		const items = listQuery.data?.items ?? [];
		const softwareByLicense = new Map<number, LicenseListItem[]>();

		for (const item of items) {
			if (!isLicenseSoftwareItem(item)) {
				continue;
			}
			const parentId = item.license_id!;
			const siblings = softwareByLicense.get(parentId) ?? [];
			siblings.push({
				...item,
				display_name: item.code,
			});
			softwareByLicense.set(parentId, siblings);
		}

		return items
			.filter((item) => !isLicenseSoftwareItem(item) && item.type !== 'OEM')
			.map((item) => {
				const row: LicenseListItem = {
					...item,
					display_name: item.code,
				};
				const children = softwareByLicense.get(item.id);
				if (children?.length) {
					row.items = children;
				}
				return row;
			});
	}, [listQuery.data?.items]);

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'display_name' as const, header: 'Название' },
			{ field: 'type' as const, header: 'Тип', width: 90 },
		],
		[],
	);

	const openRow = (row: LicenseListItem) => {
		if (isLicenseSoftwareItem(row)) {
			launchApp('device-license-key', row.id);
			return;
		}
		launchApp('device-license', row.id);
	};

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
			onCreate={canCreate ? () => launchApp('device-license', 0) : undefined}
		>
			<DataTable
				storageKey="device-licenses"
				columns={columns}
				data={tableData}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={openRow}
				onEdit={canUpdate ? openRow : undefined}
				onDelete={
					canDelete
						? (row) => {
								if (isLicenseSoftwareItem(row)) {
									return Promise.resolve();
								}
								return deleteMutation.mutateAsync(row.id);
							}
						: undefined
				}
				groupItemsField="items"
				groupHeader="Программа"
				getRowLabel={(row) => row.code || String(row.id)}
			/>
		</MainListLayout>
	);
}
