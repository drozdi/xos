import { Alert, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { iblockElementApi } from '@/core/api/endpoints/iblockApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateIblockElement,
	useCanDeleteIblockElement,
	useCanReadIblockElement,
	useCanUpdateIblockElement,
} from '@/features/iblock/iblockAccess';
import { useIblockLaunchProps, useLaunchIblockApp } from '@/features/iblock/iblockAppUtils';
import { useIblockTypeBlockFilter } from '@/features/iblock/useIblockTypeBlockFilter';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function IblockElementsApp() {
	useWindowTitle('Элементы');
	const launchApp = useLaunchIblockApp();
	const launchProps = useIblockLaunchProps();
	const queryClient = useQueryClient();
	const canRead = useCanReadIblockElement();
	const canCreate = useCanCreateIblockElement();
	const canUpdate = useCanUpdateIblockElement();
	const canDelete = useCanDeleteIblockElement();

	const launchBlockId = Number(launchProps.blockId);
	const sectionId = Number(launchProps.sectionId);
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

	const filters = useMemo(() => {
		const next: Record<string, unknown> = { ...blockFilter };
		if (Number.isFinite(sectionId) && sectionId > 0) {
			next.section_id = sectionId;
		}
		return next;
	}, [blockFilter, sectionId]);

	const pagination = usePaginatedList({ filters });

	const listQuery = useQuery({
		queryKey: queryKeys.iblock.elements(pagination.listRequest),
		queryFn: () => iblockElementApi.list(pagination.listRequest),
		placeholderData: keepPreviousData,
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => iblockElementApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({
				queryKey: queryKeys.iblock.elements(pagination.listRequest),
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
			{ field: 'section_id' as const, header: 'Раздел', width: 90 },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
			{ field: 'active' as const, header: 'Активен', width: 90 },
		],
		[],
	);

	const openProps = useMemo(() => {
		const props: Record<string, unknown> = {};
		if (selectedBlockId != null && selectedBlockId > 0) {
			props.blockId = selectedBlockId;
		}
		if (Number.isFinite(sectionId) && sectionId > 0) {
			props.sectionId = sectionId;
		}
		return Object.keys(props).length > 0 ? props : undefined;
	}, [selectedBlockId, sectionId]);

	const openElement = (id: number) => launchApp('iblock-element', id, openProps);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр элементов
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Элементы"
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
			onCreate={canCreate ? () => openElement(0) : undefined}
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
				storageKey="iblock-elements"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openElement(row.id)}
				onEdit={canUpdate ? (row) => openElement(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
