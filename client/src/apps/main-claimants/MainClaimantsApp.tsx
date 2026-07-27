import { Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable, usePaginatedList } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { mainClaimantApi, type ClaimantListItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanCreateMainClaimant,
	useCanDeleteMainClaimant,
	useCanReadMainClaimant,
	useCanUpdateMainClaimant,
} from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';

export default function MainClaimantsApp() {
	useWindowTitle('Заявители');
	const launchMainApp = useLaunchMainApp();
	const queryClient = useQueryClient();
	const canRead = useCanReadMainClaimant();
	const canCreate = useCanCreateMainClaimant();
	const canUpdate = useCanUpdateMainClaimant();
	const canDelete = useCanDeleteMainClaimant();
	const pagination = usePaginatedList();

	const listQuery = useQuery({
		queryKey: queryKeys.main.claimants(pagination.listRequest),
		queryFn: () => mainClaimantApi.list(pagination.listRequest),
		enabled: canRead,
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => mainClaimantApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.main.claimants(pagination.listRequest) });
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const columns = useMemo(
		() => [
			{ field: 'code' as const, header: 'Код', width: 120 },
			{ field: 'name' as const, header: 'Название' },
		],
		[],
	);

	const openClaimant = (id: number) => launchMainApp('main-claimant', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр заявителей
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Заявители"
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
			onCreate={canCreate ? () => openClaimant(0) : undefined}
		>
			<DataTable
				storageKey="main-claimants"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.total}
				page={pagination.page}
				limit={pagination.limit}
				onPageChange={pagination.onPageChange}
				onLimitChange={pagination.onLimitChange}
				serverPagination
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openClaimant(row.id)}
				onEdit={canUpdate ? (row) => openClaimant(row.id) : undefined}
				onDelete={canDelete ? (row) => deleteMutation.mutateAsync(row.id) : undefined}
				canEdit={canUpdate}
				canDelete={canDelete}
				getRowLabel={(row: ClaimantListItem) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
