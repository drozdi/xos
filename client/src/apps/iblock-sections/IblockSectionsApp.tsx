import { Alert, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockSectionApi } from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateIblockSection,
	useCanDeleteIblockSection,
	useCanReadIblockSection,
	useCanUpdateIblockSection,
} from '@/features/iblock/iblockAccess';
import { useIblockLaunchProps, useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { useIblockTypeBlockFilter } from '@/features/iblock/useIblockTypeBlockFilter';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function IblockSectionsApp() {
	useWindowTitle('Разделы');
	const launchApp = useLaunchIblockApp();
	const launchProps = useIblockLaunchProps();
	const queryClient = useQueryClient();
	const canRead = useCanReadIblockSection();
	const canCreate = useCanCreateIblockSection();
	const canUpdate = useCanUpdateIblockSection();
	const canDelete = useCanDeleteIblockSection();

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
		queryKey: queryKeys.iblock.sections(pagination.listRequest),
		queryFn: () => iblockSectionApi.list(pagination.listRequest),
		placeholderData: keepPreviousData,
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockSectionApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.iblock.sections(pagination.listRequest),
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
			{ field: 'level' as const, header: 'Уровень', width: 90 },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
		],
		[],
	);

	const openSection = (id: number) =>
		launchApp(
			'iblock-section',
			id,
			selectedBlockId != null && selectedBlockId > 0 ? { blockId: selectedBlockId } : undefined,
		);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр разделов
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Разделы"
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
			onCreate={canCreate ? () => openSection(0) : undefined}
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
				storageKey="iblock-sections"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openSection(row.id)}
				onEdit={canUpdate ? (row) => openSection(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
