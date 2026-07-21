import { Alert, Checkbox, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
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

export default function DeviceSubDevicesApp() {
	useWindowTitle('Комплектующие');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadSubDevice();
	const canCreate = useCanCreateSubDevice();
	const canUpdate = useCanUpdateSubDevice();
	const canDelete = useCanDeleteSubDevice();
	const [typeId, setTypeId] = useState<string | null>(null);
	const [discardedOnly, setDiscardedOnly] = useState(false);

	const listFilters = useMemo(() => {
		if (!typeId) {
			return {};
		}
		return {
			type: Number(typeId),
			accounting: { discarded: discardedOnly },
		};
	}, [typeId, discardedOnly]);

	const pagination = usePaginatedList({ filters: listFilters });

	const filterQuery = useQuery({
		queryKey: queryKeys.device.subDeviceFilter,
		queryFn: () => subDeviceApi.filter(),
		enabled: canRead,
	});

	const listQuery = useQuery({
		queryKey: queryKeys.device.subDevices(pagination.listRequest),
		queryFn: () => subDeviceApi.list(pagination.listRequest),
		enabled: canRead && typeId !== null,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => subDeviceApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.subDevices(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const typeOptions = useMemo(() => {
		const options: { value: string; label: string }[] = [];
		for (const item of filterQuery.data ?? []) {
			if (item.value == null) {
				continue;
			}
			options.push({
				value: String(item.value),
				label: item.label ?? String(item.value),
			});
		}
		return options;
	}, [filterQuery.data]);

	useEffect(() => {
		const firstType = typeOptions[0];
		if (typeId !== null || !firstType) {
			return;
		}
		setTypeId(firstType.value);
	}, [typeId, typeOptions]);

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
			isLoading={listQuery.isLoading || filterQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить данные')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={canCreate ? () => openSubDevice(0) : undefined}
			filters={
				<Stack gap="xs">
					<Select
						label="Тип"
						data={typeOptions}
						value={typeId}
						onChange={setTypeId}
						searchable
						clearable={false}
						disabled={typeOptions.length === 0}
					/>
					<Checkbox
						label="Списан"
						checked={discardedOnly}
						onChange={(e) => setDiscardedOnly(e.currentTarget.checked)}
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="device-sub-devices"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openSubDevice(row.id)}
				onEdit={canUpdate ? (row) => openSubDevice(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || String(row.id)}
			/>
		</MainListLayout>
	);
}
