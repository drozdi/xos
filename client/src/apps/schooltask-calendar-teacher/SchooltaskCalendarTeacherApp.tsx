import { Alert, Box } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { EventTeacherModal } from '@/features/schooltask/EventTeacherModal';
import {
	useCanReadSchooltaskEvent,
	useCanUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';
import { formatCalendarRange, WeekCalendar } from '@/features/schooltask/WeekCalendar';

export default function SchooltaskCalendarTeacherApp() {
	useWindowTitle('Мои уроки');
	const canRead = useCanReadSchooltaskEvent();
	const canUpdate = useCanUpdateSchooltaskEvent();
	const [range, setRange] = useState(() => formatCalendarRange(new Date(), new Date()));
	const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

	const eventsQuery = useQuery({
		queryKey: queryKeys.schooltask.teacherEvents(range),
		queryFn: () => schooltaskCalendarApi.teacherEvents(range),
		enabled: canRead,
	});

	const handleRangeChange = useCallback((start: Date, end: Date) => {
		setRange(formatCalendarRange(start, end));
	}, []);

	if (!canRead) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на просмотр уроков
			</Alert>
		);
	}

	return (
		<Box p="md" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
			<Box style={{ flex: 1, minHeight: 0 }}>
				<WeekCalendar
					events={eventsQuery.data ?? []}
					isLoading={eventsQuery.isFetching}
					onRangeChange={handleRangeChange}
					onEventClick={(event) => {
						if (canUpdate) {
							setSelectedEventId(event.id);
						}
					}}
				/>
			</Box>
			<EventTeacherModal
				eventId={selectedEventId}
				opened={selectedEventId !== null && canUpdate}
				onClose={() => setSelectedEventId(null)}
				onSaved={() => void eventsQuery.refetch()}
			/>
		</Box>
	);
}
