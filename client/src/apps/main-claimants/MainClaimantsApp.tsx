import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { mainClaimantApi, type ClaimantListItem } from '@/core/api/endpoints/mainApi';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: 50, offset: 1 };

export default function MainClaimantsApp() {
	useWindowTitle('Заявители');
	const launchMainApp = useLaunchMainApp();

	const listQuery = useQuery({
		queryKey: queryKeys.main.claimants(listRequest),
		queryFn: () => mainClaimantApi.list(listRequest),
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
			/>
		</MainListLayout>
	);
}
