import { Alert } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useCanReadSchooltaskEvent } from '@/features/schooltask/schooltaskAccess';
import { useLaunchSchooltaskApp } from '@/features/schooltask/schooltaskAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function SchooltaskCalendarsApp() {
	useWindowTitle('Расписание');
	const launchApp = useLaunchSchooltaskApp();
	const canRead = useCanReadSchooltaskEvent();

	const listQuery = useQuery({
		queryKey: queryKeys.schooltask.calendarClasses,
		queryFn: () => schooltaskCalendarApi.listClasses(),
		enabled: canRead,
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Класс' },
		],
		[],
	);

	if (!canRead) {
		return (
			<MainListLayout title="Расписание" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red" title="Доступ запрещён">
					Нет прав на просмотр расписания
				</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Расписание"
			total={listQuery.data?.length}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить данные')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
		>
			<DataTable
				storageKey="schooltask-calendars"
				columns={columns}
				data={listQuery.data ?? []}
				total={listQuery.data?.length}
				loading={listQuery.isFetching && !listQuery.isLoading}
				onRowClick={(row) => launchApp('schooltask-calendar', row.id, row.name)}
				getRowLabel={(row) => row.name}
			/>
		</MainListLayout>
	);
}
