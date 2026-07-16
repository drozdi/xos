import { Select, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/table';
import { mainUserApi, type UserListItem } from '@/core/api/endpoints/mainApi';
import { extractApiErrorMessage } from '@/core/api/apiError';
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
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'login' as const, header: 'Логин' },
			{ field: 'alias' as const, header: 'Псевдоним' },
			{ field: 'ou' as const, header: 'Подразделение' },
			{ field: 'tutor' as const, header: 'Руководитель' },
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
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить данные')
					: undefined
			}
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
			<DataTable
				storageKey="main-users"
				columns={columns}
				data={listQuery.data?.items ?? []}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => openUser(row.id)}
			/>
		</MainListLayout>
	);
}
