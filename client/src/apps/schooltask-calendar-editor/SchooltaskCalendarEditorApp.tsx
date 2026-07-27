import { Alert, Box, Button, Group, Stack, Text } from '@mantine/core';
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
			<Alert color="red" title="Доступ запрещён" m="md">
				Нет прав на редактирование расписания
			</Alert>
		);
	}

	if (classId <= 0) {
		return (
			<Alert color="yellow" title="Класс не выбран" m="md">
				Откройте редактор с указанием classId
			</Alert>
		);
	}

	return (
		<Box p="md" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
			<Group justify="space-between" mb="sm">
				<Stack gap={2}>
					<Text fw={600}>{infoQuery.data?.name ?? `Класс #${classId}`}</Text>
					{infoQuery.data?.teacher ? (
						<Text size="sm" c="dimmed">
							Классный руководитель: {infoQuery.data.teacher}
						</Text>
					) : null}
				</Stack>
				{canUpdate ? (
					<Button size="xs" onClick={openNewEvent}>
						Добавить урок
					</Button>
				) : null}
			</Group>
			<Box style={{ flex: 1, minHeight: 0 }}>
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
			</Box>
			<EventEditorModal
				classId={classId}
				eventId={selectedEventId}
				initialStart={slotStart}
				initialEnd={slotEnd}
				opened={editorOpen}
				onClose={() => setEditorOpen(false)}
				onSaved={() => void eventsQuery.refetch()}
			/>
		</Box>
	);
}
