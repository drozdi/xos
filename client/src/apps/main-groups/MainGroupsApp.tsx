import { Select } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { VirtualTable } from '@/components/tables';
import { mainGroupApi, type GroupListItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const ALL_FILTER = -1;

export default function MainGroupsApp() {
	useWindowTitle('Группы');
	const launchMainApp = useLaunchMainApp();
	const [ouFilter, setOuFilter] = useState<number>(ALL_FILTER);

	const listRequest: ListRequest = useMemo(
		() => ({
			limit: 50,
			offset: 1,
			filters: { ou: ouFilter },
		}),
		[ouFilter],
	);

	const filterQuery = useQuery({
		queryKey: queryKeys.main.groupFilter,
		queryFn: () => mainGroupApi.filter(),
	});

	const listQuery = useQuery({
		queryKey: queryKeys.main.groups(listRequest),
		queryFn: () => mainGroupApi.list(listRequest),
	});

	const ouOptions = useMemo(
		() => [
			{ value: String(ALL_FILTER), label: 'Все подразделения' },
			...(filterQuery.data?.map((ou) => ({
				value: String(ou.id),
				label: ou.name,
			})) ?? []),
		],
		[filterQuery.data],
	);

	const columns = useMemo(
		() => [
			{ key: 'code', header: 'Код', width: 120, render: (row: GroupListItem) => row.code },
			{ key: 'name', header: 'Название', render: (row: GroupListItem) => row.name },
			{ key: 'ou', header: 'Подразделение', render: (row: GroupListItem) => row.ou },
			{ key: 'sort', header: 'Сорт.', width: 80, render: (row: GroupListItem) => row.sort },
		],
		[],
	);

	const openGroup = (id: number) => launchMainApp('main-group', id);

	return (
		<MainListLayout
			title="Группы"
			total={listQuery.data?.total}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={listQuery.error instanceof Error ? listQuery.error.message : undefined}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={() => openGroup(0)}
			filters={
				<Select
					label="Подразделение"
					data={ouOptions}
					value={String(ouFilter)}
					onChange={(value) => setOuFilter(value ? Number(value) : ALL_FILTER)}
					searchable
					clearable={false}
				/>
			}
		>
			<VirtualTable
				columns={columns}
				rows={listQuery.data?.items ?? []}
				height={360}
				getRowKey={(row) => row.id}
				onRowClick={(row) => openGroup(row.id)}
			/>
		</MainListLayout>
	);
}
