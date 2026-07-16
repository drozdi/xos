import { Select, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { VirtualTable } from '@/components/tables';
import { mainUserApi, type UserListItem } from '@/core/api/endpoints/mainApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { MainListLayout } from '@/features/main/MainListLayout';
import { useLaunchMainApp } from '@/features/main/mainAppUtils';
import type { ListRequest } from '@/types/api.types';

const ALL_FILTER = -1;

export default function MainUsersApp() {
	useWindowTitle('Пользователи');
	const launchMainApp = useLaunchMainApp();
	const [ouFilter, setOuFilter] = useState<number>(ALL_FILTER);
	const [groupFilter, setGroupFilter] = useState<number>(ALL_FILTER);

	const listRequest: ListRequest = useMemo(
		() => ({
			limit: -1,
			offset: 1,
			sortBy: [{ key: 'login', order: 'ASC' }],
			filters: { ou: ouFilter, group: groupFilter },
		}),
		[ouFilter, groupFilter],
	);

	const filterQuery = useQuery({
		queryKey: queryKeys.main.userFilter,
		queryFn: () => mainUserApi.filter(),
	});

	const listQuery = useQuery({
		queryKey: queryKeys.main.users(listRequest),
		queryFn: () => mainUserApi.list(listRequest),
	});

	const ouOptions = useMemo(
		() => [
			{ value: String(ALL_FILTER), label: 'Все подразделения' },
			...(filterQuery.data?.map((ou) => ({
				value: String(ou.value),
				label: ou.title,
			})) ?? []),
		],
		[filterQuery.data],
	);

	const groupOptions = useMemo(() => {
		const options = [{ value: String(ALL_FILTER), label: 'Все группы' }];
		if (ouFilter === ALL_FILTER) {
			return options;
		}
		const ou = filterQuery.data?.find((item) => item.value === ouFilter);
		for (const group of ou?.groups ?? []) {
			if (group.type === 'divider' || group.type === 'subheader') {
				continue;
			}
			options.push({
				value: String(group.value),
				label: group.title,
			});
		}
		return options;
	}, [filterQuery.data, ouFilter]);

	const columns = useMemo(
		() => [
			{ key: 'id', header: 'ID', width: 70, render: (row: UserListItem) => row.id },
			{ key: 'login', header: 'Логин', render: (row: UserListItem) => row.login },
			{ key: 'alias', header: 'Псевдоним', render: (row: UserListItem) => row.alias },
			{ key: 'ou', header: 'Подразделение', render: (row: UserListItem) => row.ou },
			{ key: 'tutor', header: 'Руководитель', render: (row: UserListItem) => row.tutor },
		],
		[],
	);

	const openUser = (id: number) => launchMainApp('main-user', id);

	return (
		<MainListLayout
			title="Пользователи"
			total={listQuery.data?.total}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={listQuery.error instanceof Error ? listQuery.error.message : undefined}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			onCreate={() => openUser(0)}
			createLabel="Создать"
			filters={
				<Stack gap="xs">
					<Select
						label="Подразделение"
						data={ouOptions}
						value={String(ouFilter)}
						onChange={(value) => {
							setOuFilter(value ? Number(value) : ALL_FILTER);
							setGroupFilter(ALL_FILTER);
						}}
						searchable
						clearable={false}
					/>
					<Select
						label="Группа"
						data={groupOptions}
						value={String(groupFilter)}
						onChange={(value) => setGroupFilter(value ? Number(value) : ALL_FILTER)}
						disabled={ouFilter === ALL_FILTER}
						searchable
						clearable={false}
					/>
				</Stack>
			}
		>
			<VirtualTable
				columns={columns}
				rows={listQuery.data?.items ?? []}
				height={360}
				getRowKey={(row) => row.id}
				onRowClick={(row) => openUser(row.id)}
			/>
		</MainListLayout>
	);
}
