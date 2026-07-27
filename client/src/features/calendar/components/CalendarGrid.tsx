import { Box, LoadingOverlay } from '@mantine/core';
import {
	DayView,
	getEndOfWeek,
	getStartOfWeek,
	MonthView,
	WeekView,
	type ScheduleEventData,
} from '@mantine/schedule';
import dayjs from 'dayjs';
import { useEffect, useMemo } from 'react';

import type { CalendarEventViewModel, CalendarViewMode } from '../types';

export type CalendarSlotSelection = {
	start: string;
	end: string;
	allDay?: boolean;
};

interface CalendarGridProps {
	view: CalendarViewMode;
	date: string;
	events: CalendarEventViewModel[];
	isLoading?: boolean;
	onDateChange: (date: string) => void;
	onRangeChange: (start: string, end: string) => void;
	onEventClick: (event: CalendarEventViewModel) => void;
	onSlotClick: (slot: CalendarSlotSelection) => void;
}

function normalizeDateTime(value: string): string {
	return value.includes('T') ? value.replace('T', ' ').slice(0, 19) : value.slice(0, 19);
}

function toScheduleEvents(events: CalendarEventViewModel[]): ScheduleEventData[] {
	return events.map((event) => {
		if (event.allDay) {
			const day = dayjs(event.start).startOf('day');
			return {
				id: event.uid,
				title: event.title,
				start: day.format('YYYY-MM-DD HH:mm:ss'),
				end: day.add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
				color: event.color,
				payload: { viewModel: event },
			};
		}
		const start = normalizeDateTime(event.start);
		let end = normalizeDateTime(event.end);
		// Zero-duration timed events are invisible in Day/WeekView (height 0%).
		if (!dayjs(end).isAfter(dayjs(start))) {
			end = dayjs(start).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss');
		}
		return {
			id: event.uid,
			title: event.title,
			start,
			end,
			color: event.color,
			payload: { viewModel: event },
		};
	});
}

function computeRange(view: CalendarViewMode, date: string): { start: string; end: string } {
	if (view === 'day') {
		const d = dayjs(date);
		return {
			start: d.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
			end: d.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
		};
	}
	if (view === 'week') {
		const weekStart = dayjs(getStartOfWeek({ date, firstDayOfWeek: 1 }));
		const weekEnd = dayjs(getEndOfWeek(weekStart.toDate(), 1));
		return {
			start: weekStart.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
			end: weekEnd.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
		};
	}
	const monthStart = dayjs(date).startOf('month');
	const gridStart = dayjs(getStartOfWeek({ date: monthStart.toDate(), firstDayOfWeek: 1 }));
	const lastWeekStart = gridStart.add(5, 'week');
	const gridEnd = dayjs(getEndOfWeek(lastWeekStart.toDate(), 1));
	return {
		start: gridStart.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
		end: gridEnd.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
	};
}

export function CalendarGrid({
	view,
	date,
	events,
	isLoading,
	onDateChange,
	onRangeChange,
	onEventClick,
	onSlotClick,
}: CalendarGridProps) {
	const scheduleEvents = useMemo(() => toScheduleEvents(events), [events]);

	useEffect(() => {
		const range = computeRange(view, date);
		onRangeChange(range.start, range.end);
	}, [view, date, onRangeChange]);

	const handleEventClick = (event: ScheduleEventData) => {
		const vm = (event.payload as { viewModel?: CalendarEventViewModel } | undefined)?.viewModel;
		if (vm) {
			onEventClick(vm);
		}
	};

	const common = {
		date,
		events: scheduleEvents,
		withHeader: false,
		withWeekendDays: true,
		firstDayOfWeek: 1 as const,
		highlightToday: true,
		onDateChange,
		onEventClick: handleEventClick,
		style: {
			flex: 1,
			minHeight: 0,
			height: '100%',
			display: 'flex',
			flexDirection: 'column' as const,
		},
		styles: {
			weekViewRoot: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' as const },
		},
		scrollAreaProps: { style: { flex: 1, minHeight: 0 } },
	};

	return (
		<Box
			pos="relative"
			style={{
				flex: 1,
				minHeight: 0,
				height: '100%',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<LoadingOverlay visible={Boolean(isLoading)} zIndex={5} />
			{view === 'day' ? (
				<DayView
					{...common}
					intervalMinutes={30}
					onTimeSlotClick={({ slotStart, slotEnd }) => {
						onSlotClick({
							start: normalizeDateTime(slotStart),
							end: normalizeDateTime(slotEnd),
						});
					}}
					onAllDaySlotClick={(day) => {
						onSlotClick({
							start: `${day} 00:00:00`,
							end: `${day} 23:59:59`,
							allDay: true,
						});
					}}
				/>
			) : null}
			{view === 'week' ? (
				<WeekView
					{...common}
					intervalMinutes={30}
					onTimeSlotClick={({ slotStart, slotEnd }) => {
						onSlotClick({
							start: normalizeDateTime(slotStart),
							end: normalizeDateTime(slotEnd),
						});
					}}
					onAllDaySlotClick={(day) => {
						onSlotClick({
							start: `${day} 00:00:00`,
							end: `${day} 23:59:59`,
							allDay: true,
						});
					}}
				/>
			) : null}
			{view === 'month' ? (
				<Box style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
					<MonthView
						date={date}
						events={scheduleEvents}
						withHeader={false}
						withWeekendDays
						firstDayOfWeek={1}
						highlightToday
						onDateChange={onDateChange}
						onEventClick={handleEventClick}
						consistentWeeks
						withOutsideDays
						onDayClick={(day) => {
							onSlotClick({
								start: `${day} 00:00:00`,
								end: `${day} 23:59:59`,
								allDay: true,
							});
						}}
					/>
				</Box>
			) : null}
		</Box>
	);
}
