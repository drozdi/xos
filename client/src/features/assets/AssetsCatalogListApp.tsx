import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useActiveOuId } from '@/features/main/useActiveOuId';

import type { AssetsCatalogConfig } from './assetsConfigs';
import { useLaunchAssetsApp } from './assetsAppUtils';

/**
 * Multi-OU: list respects main.active_ou_id (server OuScope on catalog).
 */
export function AssetsCatalogListApp({
	config,
}: {
	config: AssetsCatalogConfig;
}) {
	useWindowTitle(config.listTitle);
	const launchApp = useLaunchAssetsApp();
	const queryClient = useQueryClient();
	const canRead = config.access.useCanRead();
	const canCreate = config.access.useCanCreate();
	const canUpdate = config.access.useCanUpdate();
	const canDelete = config.access.useCanDelete();
	const { activeOuId, restored } = useActiveOuId();
	const ouFilters = useMemo(() => {
		if (activeOuId && activeOuId > 0) {
			return { ou: activeOuId, ou_id: activeOuId };
		}
		return {};
	}, [activeOuId]);
	const pagination = usePaginatedList({ filters: ouFilters });

	const listQuery = useQuery({
		queryKey: config.listQueryKey(pagination.listRequest),
		queryFn: () => config.api.list(pagination.listRequest),
		enabled: canRead && restored,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => config.api.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: config.detailQueryKey });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() =>
			config.listColumns.map((col) => ({
				field: col.field,
				header: col.header,
				width: col.width,
			})),
		[config.listColumns],
	);

	const openDetail = (id: number) => launchApp(config.detailAppId, id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр
			</Alert>
		);
	}

	return (
		<MainListLayout
			title={config.listTitle}
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
			onCreate={canCreate ? () => openDetail(0) : undefined}
			createLabel={config.createLabel}
		>
			<DataTable
				storageKey={config.storageKey}
				columns={columns as never}
				data={(listQuery.data?.items ?? []) as never}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openDetail(Number((row as { id: number }).id))}
				onEdit={canUpdate ? (row) => openDetail(Number((row as { id: number }).id)) : undefined}
				onDelete={
					canDelete
						? (row) => deleteMutation.mutateAsync(Number((row as { id: number }).id))
						: undefined
				}
				getRowLabel={(row) => String((row as { name?: string }).name ?? '')}
			/>
		</MainListLayout>
	);
}
