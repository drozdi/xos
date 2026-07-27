import { Alert, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { deviceSoftwareApi, deviceSoftwareTypeApi } from '@/core/api/endpoints/deviceApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateDeviceSoftware,
	useCanDeleteDeviceSoftware,
	useCanReadDeviceSoftware,
	useCanUpdateDeviceSoftware,
} from '@/features/device/deviceAccess';
import { useLaunchDeviceApp } from '@/features/device/deviceAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

type SoftwareRow = {
	id: number;
	name: string;
	sort?: number | null;
	type_id?: number | null;
	parent_id?: number | null;
	group_id?: number | null;
	group_name?: string;
	group_type?: string;
	group_sort?: number | null;
	display_name: string;
	items?: SoftwareRow[];
};

export default function DeviceSoftwaresApp() {
	useWindowTitle('Программы');
	const launchApp = useLaunchDeviceApp();
	const queryClient = useQueryClient();
	const [typeId, setTypeId] = useState<string | null>(null);
	const canRead = useCanReadDeviceSoftware();
	const canCreate = useCanCreateDeviceSoftware();
	const canUpdate = useCanUpdateDeviceSoftware();
	const canDelete = useCanDeleteDeviceSoftware();
	const pagination = usePaginatedList({
		filters: typeId ? { type: Number(typeId) } : {},
	});

	const typesQuery = useQuery({
		queryKey: queryKeys.device.softwareTypes({ limit: -1, offset: 1 }),
		queryFn: () => deviceSoftwareTypeApi.list({ limit: -1, offset: 1 }),
		enabled: canRead,
	});

	const listQuery = useQuery({
		queryKey: queryKeys.device.software(pagination.listRequest),
		queryFn: () => deviceSoftwareApi.list(pagination.listRequest),
		enabled: canRead && typeId !== null,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => deviceSoftwareApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.device.software(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const typeOptions = useMemo(
		() =>
			(typesQuery.data?.items ?? []).map((item) => ({
				value: String(item.id),
				label: item.code ? `${item.name} (${item.code})` : item.name || String(item.id),
			})),
		[typesQuery.data?.items],
	);

	useEffect(() => {
		const firstType = typeOptions[0];
		if (typeId !== null || !firstType) {
			return;
		}
		setTypeId(firstType.value);
	}, [typeId, typeOptions]);

	const tableData = useMemo<SoftwareRow[]>(() => {
		const items = listQuery.data?.items ?? [];
		const parentIds = new Set(
			items
				.filter((item) => item.group_id != null && item.group_id === item.id)
				.map((item) => item.id),
		);
		const visible = items.filter((item) => {
			if (item.group_id != null && item.group_id !== item.id) {
				return parentIds.has(item.group_id);
			}
			return true;
		});
		const order = new Map(visible.map((item, index) => [item.id, index]));
		const sorted = [...visible].sort((a, b) => {
			const aGroup = a.group_id ?? null;
			const bGroup = b.group_id ?? null;
			if (aGroup !== bGroup) {
				return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
			}
			if (aGroup == null) {
				return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
			}
			const aIsParent = a.id === aGroup ? 0 : 1;
			const bIsParent = b.id === bGroup ? 0 : 1;
			if (aIsParent !== bIsParent) {
				return aIsParent - bIsParent;
			}
			return (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0);
		});

		return sorted.map((item) => ({
			...item,
			display_name: item.group_id && item.group_id !== item.id ? `\u2514 ${item.name}` : item.name,
		}));
	}, [listQuery.data?.items]);

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'display_name' as const, header: 'Название' },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
		],
		[],
	);

	const openSoftware = (id: number) => launchApp('device-software', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр программ
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Программы"
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
			onCreate={canCreate && typeId ? () => openSoftware(0) : undefined}
			filters={
				<Stack gap="xs">
					<Select
						label="Тип программы"
						placeholder="Выберите тип"
						data={typeOptions}
						value={typeId}
						onChange={setTypeId}
						searchable
						clearable={false}
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="device-softwares"
				columns={columns}
				data={tableData}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openSoftware(row.id)}
				onEdit={canUpdate ? (row) => openSoftware(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				groupedField="group_name"
				groupedHeader="Программа"
				getRowLabel={(row) => row.name || String(row.id)}
			/>
		</MainListLayout>
	);
}
