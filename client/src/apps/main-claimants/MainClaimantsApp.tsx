import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { VirtualTable } from '@/components/tables';
import { mainClaimantApi, type ClaimantListItem } from '@/core/api/endpoints/mainApi';
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
			{ key: 'code', header: 'Код', width: 120, render: (row: ClaimantListItem) => row.code },
			{ key: 'name', header: 'Название', render: (row: ClaimantListItem) => row.name },
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
			errorMessage={listQuery.error instanceof Error ? listQuery.error.message : undefined}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={() => openClaimant(0)}
		>
			<VirtualTable
				columns={columns}
				rows={listQuery.data?.items ?? []}
				height={360}
				getRowKey={(row) => row.id}
				onRowClick={(row) => openClaimant(row.id)}
			/>
		</MainListLayout>
	);
}
