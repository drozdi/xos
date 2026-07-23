import { Alert, Button, Group } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage } from '@/core/api/apiError';
import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanReadSchooltaskEvent,
	useCanUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';
import { useLaunchSchooltaskApp } from '@/features/schooltask/schooltaskAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function SchooltaskCalendarsApp() {
	useWindowTitle('Расписание');
	const launchApp = useLaunchSchooltaskApp();
	const canRead = useCanReadSchooltaskEvent();
	const canUpdate = useCanUpdateSchooltaskEvent();

	const listQuery = useQuery({
		queryKey: queryKeys.schooltask.calendarClasses,
		queryFn: () => schooltaskCalendarApi.listClasses(),
		enabled: canRead || canUpdate,
	});

	const columns = useMemo(
		() => [
			{ field: 'id' as const, header: 'ID', width: 70 },
			{ field: 'name' as const, header: 'Класс' },
			{
				field: 'teacher' as const,
				header: 'Классный руководитель',
				render: (row: { teacher?: string | null }) => row.teacher || '—',
			},
			{
				field: 'id' as const,
				header: 'Действия',
				width: 280,
				render: (row: {
					id: number;
					name: string;
					can_edit?: boolean;
				}) => (
					<Group gap="xs" wrap="nowrap" onClick={(event) => event.stopPropagation()}>
						{(row.can_edit || canUpdate) && (
							<Button
								size="compact-xs"
								variant="light"
								onClick={() =>
									launchApp('schooltask-calendar-editor', row.id, `Редактор — ${row.name}`)
								}
							>
								Расписание
							</Button>
						)}
						{(canRead || row.can_edit) && (
							<Button
								size="compact-xs"
								variant="default"
								onClick={() =>
									launchApp('schooltask-calendar', row.id, `Расписание — ${row.name}`)
								}
							>
								Посмотреть
							</Button>
						)}
					</Group>
				),
			},
		],
		[canRead, canUpdate, launchApp],
	);

	if (!canRead && !canUpdate) {
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
				getRowLabel={(row) => row.name}
			/>
		</MainListLayout>
	);
}
