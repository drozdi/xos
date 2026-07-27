import { Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { lazy, Suspense, useCallback, useState } from 'react';

import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import {
	useCanReadSchooltaskEvent,
	useCanUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';
import { formatCalendarRange, WeekCalendar } from '@/features/schooltask/WeekCalendar';

const EventTeacherModal = lazy(() =>
	import('@/features/schooltask/EventTeacherModal').then((module) => ({
		default: module.EventTeacherModal,
	})),
);

export default function SchooltaskCalendarTeacherApp() {
	useWindowTitle('Мои уроки');
	const canRead = useCanReadSchooltaskEvent();
	const canUpdate = useCanUpdateSchooltaskEvent();
	const [range, setRange] = useState(() => formatCalendarRange(new Date(), new Date()));
	const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

	const eventsQuery = useQuery({
		queryKey: queryKeys.schooltask.teacherEvents(range),
		queryFn: () => schooltaskCalendarApi.teacherEvents(range),
		enabled: canRead || canUpdate,
	});

	const handleRangeChange = useCallback((start: Date, end: Date) => {
		setRange(formatCalendarRange(start, end));
	}, []);

	if (!canRead && !canUpdate) {
		return (
			<div style={{ margin: 16 }}>
				<Alert type="error" showIcon message="Доступ запрещён" description="Нет прав на просмотр уроков" />
			</div>
		);
	}

	return (
		<div
			style={{
				position: 'relative',
				padding: 16,
				height: '100%',
				minHeight: 0,
				display: 'flex',
				flexDirection: 'column',
				overflow: 'hidden',
			}}
		>
			<div style={{ flex: 1, minHeight: 0 }}>
				<WeekCalendar
					events={eventsQuery.data ?? []}
					isLoading={eventsQuery.isFetching}
					onRangeChange={handleRangeChange}
					onEventClick={(event) => {
						setSelectedEventId(event.id);
					}}
				/>
			</div>
			<Suspense fallback={null}>
				{selectedEventId !== null ? (
					<EventTeacherModal
						eventId={selectedEventId}
						opened
						onClose={() => setSelectedEventId(null)}
						onSaved={() => void eventsQuery.refetch()}
					/>
				) : null}
			</Suspense>
		</div>
	);
}
