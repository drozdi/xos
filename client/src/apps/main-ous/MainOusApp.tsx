import { Alert } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { mainOuApi, type OuListItem } from '@/core/api/endpoints/mainApi';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useCanCreateMainOu, useCanReadMainOu } from '@/features/main/mainAccess';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const listRequest: ListRequest = { limit: 50, offset: 1 };

export default function MainOusApp() {
	useWindowTitle('Подразделения');
	const launchMainApp = useLaunchMainApp();
	const canRead = useCanReadMainOu();
	const canCreate = useCanCreateMainOu();

	const listQuery = useQuery({
		queryKey: queryKeys.main.ous(listRequest),
		queryFn: () => mainOuApi.list(listRequest),
		enabled: canRead,
	});

	const columns = useMemo(
		() => [
			{ field: 'code' as const, header: 'Код', width: 120 },
			{ field: 'name' as const, header: 'Название' },
			{ field: 'sort' as const, header: 'Сорт.', width: 80 },
			{
				field: 'description' as const,
				header: 'Описание',
				render: (row: OuListItem) => row.description ?? '',
			},
		],
		[],
	);

	const openOu = (id: number) => launchMainApp('main-ou', id);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр подразделений
			</Alert>
		);
	}

	return (
		<MainListLayout
			title="Подразделения"
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
			onCreate={canCreate ? () => openOu(0) : undefined}
		>
			<DataTable
				storageKey="main-ous"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openOu(row.id)}
			/>
		</MainListLayout>
	);
}
