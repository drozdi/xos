import { Alert, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockPropertyApi } from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateIblockProperty,
	useCanDeleteIblockProperty,
	useCanReadIblockProperty,
	useCanUpdateIblockProperty,
} from '@/features/iblock/iblockAccess';
import { useIblockLaunchProps, useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { useIblockTypeBlockFilter } from '@/features/iblock/useIblockTypeBlockFilter';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function IblockPropertiesApp() {
	useWindowTitle('Свойства инфоблоков');
	const launchApp = useLaunchIblockApp();
	const launchProps = useIblockLaunchProps();
	const queryClient = useQueryClient();
	const canRead = useCanReadIblockProperty();
	const canCreate = useCanCreateIblockProperty();
	const canUpdate = useCanUpdateIblockProperty();
	const canDelete = useCanDeleteIblockProperty();

	const launchBlockId = Number(launchProps.blockId);
	const {
		typeId,
		blockId,
		setBlockId,
		onTypeChange,
		typeOptions,
		blockOptions,
		blockFilter,
		selectedBlockId,
	} = useIblockTypeBlockFilter(
		Number.isFinite(launchBlockId) && launchBlockId > 0 ? launchBlockId : undefined,
	);

	const pagination = usePaginatedList({ filters: blockFilter });

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.properties(pagination.listRequest),
		queryFn: () => iblockPropertyApi.list(pagination.listRequest),
		placeholderData: keepPreviousData,
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockPropertyApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.iblock.properties(pagination.listRequest),
			});
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'code' as const, header: 'Код' },
			{ field: 'block_id' as const, header: 'Блок', width: 80 },
			{ field: 'field_type' as const, header: 'Тип', width: 70 },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
			{ field: 'active' as const, header: 'Активен', width: 90 },
		],
		[],
	);

	const openProperty = (id: number) =>
		launchApp(
			'iblock-property',
			id,
			selectedBlockId != null && selectedBlockId > 0 ? { blockId: selectedBlockId } : undefined,
		);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр свойств
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Свойства инфоблоков"
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
			filters={
				<Stack gap="xs">
					<Select
						label="Тип"
						placeholder="Все типы"
						data={typeOptions}
						value={typeId}
						onChange={onTypeChange}
						searchable
						clearable
					/>
					<Select
						label="Инфоблок"
						placeholder="Все инфоблоки"
						data={blockOptions}
						value={blockId}
						onChange={setBlockId}
						searchable
						clearable
					/>
				</Stack>
			}
		>
			<DataTable
				storageKey="iblock-properties"
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
