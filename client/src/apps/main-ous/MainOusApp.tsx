import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { VirtualTable } from '@/components/tables';
import { mainOuApi, type OuListItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: 50, offset: 1 };

export default function MainOusApp() {
	useWindowTitle('Подразделения');
	const launchMainApp = useLaunchMainApp();

	const listQuery = useQuery({
		queryKey: queryKeys.main.ous(listRequest),
		queryFn: () => mainOuApi.list(listRequest),
	});

	const columns = useMemo(
		() => [
			{ key: 'code', header: 'Код', width: 120, render: (row: OuListItem) => row.code },
			{ key: 'name', header: 'Название', render: (row: OuListItem) => row.name },
			{ key: 'sort', header: 'Сорт.', width: 80, render: (row: OuListItem) => row.sort },
			{
				key: 'description',
				header: 'Описание',
				render: (row: OuListItem) => row.description ?? '',
			},
		],
		[],
	);

	const openOu = (id: number) => launchMainApp('main-ou', id);

	return (
		<MainListLayout
			title="Подразделения"
			total={listQuery.data?.total}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={listQuery.error instanceof Error ? listQuery.error.message : undefined}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={() => openOu(0)}
		>
			<VirtualTable
				columns={columns}
				rows={listQuery.data?.items ?? []}
				height={360}
				getRowKey={(row) => row.id}
				onRowClick={(row) => openOu(row.id)}
			/>
		</MainListLayout>
	);
}
