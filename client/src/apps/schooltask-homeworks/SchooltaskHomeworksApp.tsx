import { Alert, Button, Group, Select, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/table';
import { extractApiErrorMessage } from '@/core/api/apiError';
import {
	schooltaskCalendarApi,
	schooltaskHomeworkApi,
	type HomeworkItem,
} from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { useCanAccessSchooltaskCalendars } from '@/features/schooltask/schooltaskAccess';
import { useLaunchSchooltaskApp } from '@/features/schooltask/schooltaskAppUtils';
import { MainListLayout } from '@/features/main/MainListLayout';

export default function SchooltaskHomeworksApp() {
	useWindowTitle('Домашние задания');
	const launchApp = useLaunchSchooltaskApp();
	const canAccess = useCanAccessSchooltaskCalendars();
	const [classId, setClassId] = useState<string | null>(null);
	const [range, setRange] = useState<[Date | null, Date | null]>([
		dayjs().startOf('week').toDate(),
		dayjs().startOf('week').add(28, 'day').toDate(),
	]);

	const classesQuery = useQuery({
		queryKey: queryKeys.schooltask.calendarClasses,
		queryFn: () => schooltaskCalendarApi.listClasses(),
		enabled: canAccess,
	});

	const from = range[0] ? dayjs(range[0]).format('YYYY-MM-DD HH:mm:ss') : '';
	const to = range[1] ? dayjs(range[1]).endOf('day').format('YYYY-MM-DD HH:mm:ss') : '';

	const listQuery = useQuery({
		queryKey: queryKeys.schooltask.homework({
			from,
			to,
			classId: classId ? Number(classId) : null,
		}),
		queryFn: () =>
			schooltaskHomeworkApi.list({
				from,
				to,
				class_id: classId ? Number(classId) : undefined,
			}),
		enabled: canAccess && Boolean(from && to),
	});

	const classOptions = useMemo(
		() =>
			(classesQuery.data ?? []).map((c) => ({
				value: String(c.id),
				label: c.name,
			})),
		[classesQuery.data],
	);

	const columns = useMemo(
		() => [
			{
				field: 'start' as const,
				header: 'Дата',
				width: 140,
				render: (row: HomeworkItem) =>
					row.start ? dayjs(row.start).format('DD.MM.YYYY HH:mm') : '—',
			},
			{ field: 'class_name' as const, header: 'Класс', width: 100 },
			{ field: 'subject' as const, header: 'Предмет', width: 140 },
			{
				field: 'ht' as const,
				header: 'Задание',
				render: (row: HomeworkItem) => (
					<Text size="sm" lineClamp={2}>
						{row.ht || '—'}
					</Text>
				),
			},
			{
				field: 'id' as const,
				header: 'Действия',
				width: 120,
				render: (row: HomeworkItem) =>
					row.class_id ? (
						<Button
							size="compact-xs"
							variant="light"
							onClick={(e) => {
								e.stopPropagation();
								launchApp(
									'schooltask-calendar',
									row.class_id!,
									`Расписание — ${row.class_name ?? ''}`,
								);
							}}
						>
							Календарь
						</Button>
					) : null,
			},
		],
		[launchApp],
	);

	if (!canAccess) {
		return (
			<MainListLayout title="Домашние задания" isLoading={false} isError={false} onRefresh={() => {}}>
				<Alert color="red">Нет доступа к домашним заданиям</Alert>
			</MainListLayout>
		);
	}

	return (
		<MainListLayout
			title="Домашние задания"
			total={listQuery.data?.items.length}
			isLoading={listQuery.isLoading}
			isError={listQuery.isError}
			errorMessage={
				listQuery.error
					? extractApiErrorMessage(listQuery.error, 'Не удалось загрузить ДЗ')
					: undefined
			}
			isFetching={listQuery.isFetching}
			onRefresh={() => void listQuery.refetch()}
			filters={
				<Group gap="sm" wrap="wrap">
					<Select
						placeholder="Все классы"
						clearable
						data={classOptions}
						value={classId}
						onChange={setClassId}
						w={180}
						size="xs"
					/>
					<DatePickerInput
						type="range"
						value={range}
						onChange={(value) =>
							setRange(Array.isArray(value) ? (value as [Date | null, Date | null]) : [null, null])
						}
						size="xs"
						w={260}
						clearable={false}
					/>
				</Group>
			}
		>
			<DataTable
				storageKey="schooltask-homeworks"
				columns={columns}
				data={listQuery.data?.items ?? []}
				total={listQuery.data?.items.length}
				loading={listQuery.isLoading}
			/>
		</MainListLayout>
	);
}
