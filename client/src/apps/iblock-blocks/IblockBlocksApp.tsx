import { Alert, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockBlockApi } from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateIblockBlock,
	useCanDeleteIblockBlock,
	useCanReadIblockBlock,
	useCanUpdateIblockBlock,
} from '@/features/iblock/iblockAccess';
import { useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { useIblockTypeBlockFilter } from '@/features/iblock/useIblockTypeBlockFilter';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function IblockBlocksApp() {
	useWindowTitle('Инфоблоки');
	const launchApp = useLaunchIblockApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadIblockBlock();
	const canCreate = useCanCreateIblockBlock();
	const canUpdate = useCanUpdateIblockBlock();
	const canDelete = useCanDeleteIblockBlock();
	const { typeId, onTypeChange, typeOptions, typeFilter } = useIblockTypeBlockFilter();
	const pagination = usePaginatedList({ filters: typeFilter });

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.blocks(pagination.listRequest),
		queryFn: () => iblockBlockApi.list(pagination.listRequest),
		placeholderData: keepPreviousData,
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockBlockApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.iblock.blocks(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'code' as const, header: 'Код' },
			{ field: 'type_id' as const, header: 'Тип', width: 80 },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
			{ field: 'active' as const, header: 'Активен', width: 90 },
		],
		[],
	);

	const openBlock = (id: number) =>
		launchApp(
			'iblock-block',
			id,
			typeId ? { typeId: Number(typeId) } : undefined,
		);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр инфоблоков
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Инфоблоки"
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
			onCreate={canCreate ? () => openBlock(0) : undefined}
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
				</Stack>
			}
		>
			<DataTable
				storageKey="iblock-blocks"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openBlock(row.id)}
				onEdit={canUpdate ? (row) => openBlock(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
