import { Alert, Checkbox, Flex, Form, Select } from 'antd';
import { notifications } from '@/ui/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
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
import {
	buildDeviceTypeSelectGroups,
	getFirstSelectValue,
} from '@/features/device/deviceFilterUtils';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function DeviceDevicesApp() {
	useWindowTitle('Устройства');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadDevice();
	const canCreate = useCanCreateDevice();
	const canUpdate = useCanUpdateDevice();
	const canDelete = useCanDeleteDevice();
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

	const pagination = usePaginatedList({
		sortBy: [{ key: 'sort', order: 'ASC' }],
		filters: listFilters,
	});

	const filterQuery = useQuery({
		queryKey: queryKeys.device.filter,
		queryFn: () => deviceApi.filter(),
		enabled: canRead,
	});

	const listQuery = useQuery({
		queryKey: queryKeys.device.devices(pagination.listRequest),
		queryFn: () => deviceApi.list(pagination.listRequest),
		enabled: canRead && typeId !== null,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deviceApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.devices(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const typeSelectGroups = useMemo(
		() => buildDeviceTypeSelectGroups(filterQuery.data ?? []),
		[filterQuery.data],
	);

	const typeSelectOptions = useMemo(
		() =>
			typeSelectGroups.map((group) => ({
				label: group.group,
				options: group.items.map((item) => ({ value: item.value, label: item.label })),
			})),
		[typeSelectGroups],
	);

	useEffect(() => {
		if (typeId !== null) {
			return;
		}
		const firstType = getFirstSelectValue(typeSelectGroups);
		if (firstType) {
			setTypeId(firstType);
		}
	}, [typeId, typeSelectGroups]);

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
				<Alert
					type="error"
					showIcon
					message="Доступ запрещён"
					description="Нет прав на просмотр устройств"
				/>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Устройства"
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
			onCreate={canCreate && typeId ? () => openDevice(0) : undefined}
			filters={
				<Flex vertical gap={8}>
					<Form.Item label="Тип" style={{ marginBottom: 0 }}>
						<Select
							options={typeSelectOptions}
							value={typeId}
							onChange={setTypeId}
							showSearch
							allowClear={false}
							disabled={typeSelectGroups.length === 0}
						/>
					</Form.Item>
					<Checkbox
						checked={discardedOnly}
						onChange={(e) => setDiscardedOnly(e.target.checked)}
					>
						Списан
					</Checkbox>
				</Flex>
			}
		>
			<DataTable
				storageKey="device-devices"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openDevice(row.id)}
				onEdit={canUpdate ? (row) => openDevice(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.code || String(row.id)}
			/>
		</MainListLayout>
	);
}
