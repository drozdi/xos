import { Alert, Box, Stack, Text } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { EventDetailModal } from '@/features/schooltask/EventDetailModal';
import { useCanReadSchooltaskEvent } from '@/features/schooltask/schooltaskAccess';
import { useClassId } from '@/features/schooltask/schooltaskAppUtils';
import { formatCalendarRange, WeekCalendar } from '@/features/schooltask/WeekCalendar';

export default function SchooltaskCalendarApp() {
	const classId = useClassId();
	const canRead = useCanReadSchooltaskEvent();
	const [range, setRange] = useState(() => formatCalendarRange(new Date(), new Date()));
	const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

	const infoQuery = useQuery({
		queryKey: queryKeys.schooltask.calendarInfo(classId),
		queryFn: () => schooltaskCalendarApi.classInfo(classId),
		enabled: canRead && classId > 0,
	});

	const eventsQuery = useQuery({
		queryKey: queryKeys.schooltask.studentEvents(classId, range),
		queryFn: () => schooltaskCalendarApi.studentEvents(classId, range),
		enabled: canRead && classId > 0,
	});

	useWindowTitle(infoQuery.data?.name ? `Расписание — ${infoQuery.data.name}` : 'Календарь класса');

	const handleRangeChange = useCallback((start: Date, end: Date) => {
		setRange(formatCalendarRange(start, end));
	}, []);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр расписания
			</Alert>
		);
	}

	if (classId <= 0) {
		return (
			<Alert color="yellow" title="Класс не выбран" m="md">
				Откройте расписание из списка классов
			</Alert>
		);
	}

	return (
		<Box p="md" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
			<Stack gap="xs" mb="sm">
				<Text fw={600}>{infoQuery.data?.name ?? `Класс #${classId}`}</Text>
			</Stack>
			<Box style={{ flex: 1, minHeight: 0 }}>
				<WeekCalendar
					events={eventsQuery.data ?? []}
					isLoading={eventsQuery.isFetching}
					onRangeChange={handleRangeChange}
					onEventClick={(event) => setSelectedEventId(event.id)}
				/>
			</Box>
			<EventDetailModal
				classId={classId}
				eventId={selectedEventId}
				opened={selectedEventId !== null}
				onClose={() => setSelectedEventId(null)}
			/>
		</Box>
	);
}
