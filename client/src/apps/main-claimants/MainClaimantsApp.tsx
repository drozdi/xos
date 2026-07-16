import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage, notifyApiError } from '@/core/api/apiError';
import { mainClaimantApi } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: 50, offset: 1 };

export default function MainClaimantsApp() {
	useWindowTitle('Заявители');
	const launchMainApp = useLaunchMainApp();
	const queryClient = useQueryClient();

	const listQuery = useQuery({
		queryKey: queryKeys.main.claimants(listRequest),
		queryFn: () => mainClaimantApi.list(listRequest),
	});

	const deleteMutation = useMutation({
		mutationFn: (id: number) => mainClaimantApi.remove(id),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.main.claimants(listRequest) });
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
			onCreate={() => openClaimant(0)}
		>
			<DataTable
				storageKey="main-claimants"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openClaimant(row.id)}
				onEdit={(row) => openClaimant(row.id)}
				onDelete={(row) => deleteMutation.mutateAsync(row.id)}
				getRowLabel={(row) => row.name || row.code}
			/>
		</MainListLayout>
	);
}
