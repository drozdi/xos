import { Alert, Button, Flex, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';

import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useWindowTitle } from '@/core/hooks/useWindowTitle';
import { EventEditorModal } from '@/features/schooltask/EventEditorModal';
import {
	useCanReadSchooltaskEvent,
	useCanUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';
import { useClassId } from '@/features/schooltask/schooltaskAppUtils';
import { formatCalendarRange, WeekCalendar, type WeekCalendarSlot } from '@/features/schooltask/WeekCalendar';

export default function SchooltaskCalendarEditorApp() {
	const classId = useClassId();
	const canRead = useCanReadSchooltaskEvent();
	const canUpdate = useCanUpdateSchooltaskEvent();
	const [range, setRange] = useState(() => formatCalendarRange(new Date(), new Date()));
	const [editorOpen, setEditorOpen] = useState(false);
	const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
	const [slotStart, setSlotStart] = useState<string | null>(null);
	const [slotEnd, setSlotEnd] = useState<string | null>(null);

	const infoQuery = useQuery({
		queryKey: queryKeys.schooltask.calendarInfo(classId),
		queryFn: () => schooltaskCalendarApi.classInfo(classId),
		enabled: canRead && classId > 0,
	});

	const eventsQuery = useQuery({
		queryKey: queryKeys.schooltask.editorEvents(classId, range),
		queryFn: () => schooltaskCalendarApi.editorEvents(classId, range),
		enabled: canRead && classId > 0,
	});

	useWindowTitle(infoQuery.data?.name ? `Редактор — ${infoQuery.data.name}` : 'Редактор расписания');

	const handleRangeChange = useCallback((start: Date, end: Date) => {
		setRange(formatCalendarRange(start, end));
	}, []);

	const openNewEvent = () => {
		setSelectedEventId(null);
		setSlotStart(dayjs().hour(8).minute(0).format('YYYY-MM-DD HH:mm:ss'));
		setSlotEnd(dayjs().hour(8).minute(45).format('YYYY-MM-DD HH:mm:ss'));
		setEditorOpen(true);
	};

	const openSlot = (slot: WeekCalendarSlot) => {
		setSelectedEventId(null);
		setSlotStart(slot.start);
		setSlotEnd(slot.end);
		setEditorOpen(true);
	};

	if (!canRead && !canUpdate) {
		return (
			<div style={{ margin: 16 }}>
				<Alert
					type="error"
					showIcon
					message="Доступ запрещён"
					description="Нет прав на редактирование расписания"
				/>
			</div>
		);
	}

	if (classId <= 0) {
		return (
			<div style={{ margin: 16 }}>
				<Alert
					type="warning"
					showIcon
					message="Класс не выбран"
					description="Откройте редактор с указанием classId"
				/>
			</div>
		);
	}

	return (
		<div style={{ padding: 16, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
			<Flex justify="space-between" align="flex-start" style={{ marginBottom: 12 }}>
				<Flex vertical gap={2}>
					<Typography.Text strong>{infoQuery.data?.name ?? `Класс #${classId}`}</Typography.Text>
					{infoQuery.data?.teacher ? (
						<Typography.Text type="secondary" style={{ fontSize: 13 }}>
							Классный руководитель: {infoQuery.data.teacher}
						</Typography.Text>
					) : null}
				</Flex>
				{canUpdate ? (
					<Button size="small" type="primary" onClick={openNewEvent}>
						Добавить урок
					</Button>
				) : null}
			</Flex>
			<div style={{ flex: 1, minHeight: 0 }}>
				<WeekCalendar
					events={eventsQuery.data ?? []}
					isLoading={eventsQuery.isFetching}
					onRangeChange={handleRangeChange}
					onEventClick={(event) => {
						setSelectedEventId(event.id);
						setSlotStart(null);
						setSlotEnd(null);
						setEditorOpen(true);
					}}
					onSlotClick={canUpdate ? openSlot : undefined}
				/>
			</div>
			<EventEditorModal
				classId={classId}
				eventId={selectedEventId}
				initialStart={slotStart}
				initialEnd={slotEnd}
				opened={editorOpen}
				onClose={() => setEditorOpen(false)}
				onSaved={() => void eventsQuery.refetch()}
			/>
		</div>
	);
}
