import { Alert, Flex, Typography } from 'antd';
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
			<div style={{ margin: 16 }}>
				<Alert type="error" showIcon message="Доступ запрещён" description="Нет прав на просмотр расписания" />
			</div>
		);
	}

	if (classId <= 0) {
		return (
			<div style={{ margin: 16 }}>
				<Alert type="warning" showIcon message="Класс не выбран" description="Откройте расписание из списка классов" />
			</div>
		);
	}

	return (
		<div style={{ padding: 16, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
			<Flex vertical gap={4} style={{ marginBottom: 12 }}>
				<Typography.Text strong>{infoQuery.data?.name ?? `Класс #${classId}`}</Typography.Text>
			</Flex>
			<div style={{ flex: 1, minHeight: 0 }}>
				<WeekCalendar
					events={eventsQuery.data ?? []}
					isLoading={eventsQuery.isFetching}
					onRangeChange={handleRangeChange}
					onEventClick={(event) => setSelectedEventId(event.id)}
				/>
			</div>
			<EventDetailModal
				classId={classId}
				eventId={selectedEventId}
				opened={selectedEventId !== null}
				onClose={() => setSelectedEventId(null)}
			/>
		</div>
	);
}
