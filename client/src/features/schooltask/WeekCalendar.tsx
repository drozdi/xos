import { Box, LoadingOverlay } from '@mantine/core';
import {
	getEndOfWeek,
	getStartOfWeek,
	WeekView,
	type ScheduleEventData,
} from '@mantine/schedule';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { CalendarEvent } from '@/core/api/endpoints/schooltaskApi';

const VISIBLE_WEEK_DAYS = 6;

const COLOR_MAP: Record<string, string> = {
	green: 'green',
	blue: 'blue',
	orange: 'orange',
};

export interface WeekCalendarSlot {
	start: string;
	end: string;
}

interface WeekCalendarProps {
	events: CalendarEvent[];
	isLoading?: boolean;
	onRangeChange: (start: Date, end: Date) => void;
	onEventClick?: (event: CalendarEvent) => void;
	onSlotClick?: (slot: WeekCalendarSlot) => void;
}

function normalizeDateTime(value: string): string {
	return value.includes('T') ? value.replace('T', ' ').slice(0, 19) : value;
}

function toScheduleEvents(events: CalendarEvent[]): ScheduleEventData[] {
	return events.map((event) => ({
		id: event.id,
		title: event.name,
		start: normalizeDateTime(event.start),
		end: normalizeDateTime(event.end),
		color: COLOR_MAP[event.color ?? 'blue'] ?? 'blue',
		payload: { calendarEvent: event },
	}));
}

function getVisibleWeekRange(date: string | Date) {
	const weekStart = dayjs(getStartOfWeek({ date, firstDayOfWeek: 1 }));
	const weekEnd = weekStart.add(VISIBLE_WEEK_DAYS - 1, 'day').endOf('day');

	return {
		start: weekStart.toDate(),
		end: weekEnd.toDate(),
	};
}

export function WeekCalendar({
	events,
	isLoading,
	onRangeChange,
	onEventClick,
	onSlotClick,
}: WeekCalendarProps) {
	const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'));

	const scheduleEvents = useMemo(() => toScheduleEvents(events), [events]);

	useEffect(() => {
		const { start, end } = getVisibleWeekRange(date);
		onRangeChange(start, end);
	}, [date, onRangeChange]);

	const handleEventClick = useCallback(
		(event: ScheduleEventData) => {
			const source = event.payload?.calendarEvent as CalendarEvent | undefined;
			if (source) {
				onEventClick?.(source);
				return;
			}
			const matched = events.find((item) => item.id === event.id);
			if (matched) {
				onEventClick?.(matched);
			}
		},
		[events, onEventClick],
	);

	const handleTimeSlotClick = useCallback(
		({ slotStart, slotEnd }: { slotStart: string; slotEnd: string }) => {
			onSlotClick?.({
				start: normalizeDateTime(slotStart),
				end: normalizeDateTime(slotEnd),
			});
		},
		[onSlotClick],
	);

	const handleSlotDragEnd = useCallback(
		(rangeStart: string, rangeEnd: string) => {
			onSlotClick?.({
				start: normalizeDateTime(rangeStart),
				end: normalizeDateTime(rangeEnd),
			});
		},
		[onSlotClick],
	);

	return (
		<Box style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
			<LoadingOverlay visible={Boolean(isLoading)} zIndex={10} />
			<WeekView
				date={date}
				onDateChange={setDate}
				events={scheduleEvents}
				firstDayOfWeek={1}
				weekendDays={[0]}
				withWeekendDays={false}
				startTime="07:00:00"
				endTime="20:00:00"
				startScrollTime="07:00:00"
				highlightToday
				withCurrentTimeIndicator
				withAllDaySlots={false}
				withWeekNumber={false}
				viewSelectProps={{ style: { display: 'none' } }}
				labels={{
					today: 'Сегодня',
					previous: 'Назад',
					next: 'Вперёд',
					week: 'Неделя',
				}}
				scrollAreaProps={{ style: { flex: 1, minHeight: 320 } }}
				style={{ flex: 1, minHeight: 0 }}
				onEventClick={onEventClick ? handleEventClick : undefined}
				onTimeSlotClick={onSlotClick ? handleTimeSlotClick : undefined}
				withDragSlotSelect={Boolean(onSlotClick)}
				onSlotDragEnd={onSlotClick ? handleSlotDragEnd : undefined}
				renderWeekLabel={({ weekStart, weekEnd }) => {
					const end = dayjs(getEndOfWeek(weekStart, 1));
					const visibleEnd = dayjs(weekStart).add(VISIBLE_WEEK_DAYS - 1, 'day');
					const labelEnd = visibleEnd.isBefore(end) ? visibleEnd : end;

					return `${dayjs(weekStart).format('DD.MM')} — ${labelEnd.format('DD.MM.YYYY')}`;
				}}
			/>
		</Box>
	);
}

export function formatCalendarRange(start: Date, end: Date) {
	return {
		start: dayjs(start).format('YYYY-MM-DD HH:mm:ss'),
		end: dayjs(end).format('YYYY-MM-DD HH:mm:ss'),
	};
}
