import { Alert, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { deviceApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateDevice,
	useCanDeleteDevice,
	useCanReadDevice,
	useCanUpdateDevice,
} from '@/features/device/deviceAccess';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';
import type { ListRequest } from '@/types/api.types';

const ALL_FILTER = -1;

export default function DeviceDevicesApp() {
	useWindowTitle('Устройства');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadDevice();
	const canCreate = useCanCreateDevice();
	const canUpdate = useCanUpdateDevice();
	const canDelete = useCanDeleteDevice();
	const [typeFilter, setTypeFilter] = useState<number>(ALL_FILTER);

	const listRequest: ListRequest = useMemo(
		() => ({
			limit: -1,
			offset: 1,
			sortBy: [{ key: 'sort', order: 'ASC' }],
			filters: typeFilter === ALL_FILTER ? {} : { type: typeFilter },
		}),
		[typeFilter],
	);

	const filterQuery = useQuery({
		queryKey: queryKeys.device.filter,
		queryFn: () => deviceApi.filter(),
	});

	const listQuery = useQuery({
		queryKey: queryKeys.device.devices(listRequest),
		queryFn: () => deviceApi.list(listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deviceApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.devices(listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const typeOptions = useMemo(() => {
		const options = [{ value: String(ALL_FILTER), label: 'Все типы' }];
		for (const item of filterQuery.data ?? []) {
			if (item.type === 'divider' || item.value == null) {
				continue;
			}
			const prefix = item.type === 'subheader' ? '▸ ' : '';
			options.push({
				value: String(item.value),
				label: `${prefix}${item.label ?? item.value}`,
			});
		}
		return options;
	}, [filterQuery.data]);

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'code' as const, header: 'Код' },
			{ field: 'location' as const, header: 'Расположение' },
			{ field: 'inNo' as const, header: 'Инв. №' },
		],
		[],
	);

	const openDevice = (id: number) => launchApp('device-device', id);

	if (!canRead) {
		return (
			<MainListLayout title="Устройства" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red" title="Доступ запрещён">
					Нет прав на просмотр устройств
				</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Устройства"
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
			onCreate={canCreate ? () => openDevice(0) : undefined}
			filters={
				<Stack gap="xs">
					<Select
						label="Тип"
						data={typeOptions}
						value={String(typeFilter)}
						onChange={(value) => setTypeFilter(value ? Number(value) : ALL_FILTER)}
						searchable
						clearable={false}
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="device-devices"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openDevice(row.id)}
				onEdit={canUpdate ? (row) => openDevice(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.code || String(row.id)}
			/>
		</MainListLayout>
	);
}
