import dayjs from 'dayjs';

import type { BoardDueCard } from '@/core/api/endpoints/boardApi';
import type { CalendarEventDto } from '@/core/api/endpoints/calendarApi';
import type { CalendarEvent as SchooltaskCalendarEvent } from '@/core/api/endpoints/schooltaskApi';
import type { TodoDueItem } from '@/core/api/endpoints/todoApi';

import {
	BOARD_OVERLAY_COLOR,
	SCHOOLTASK_OVERLAY_COLOR,
	TODO_OVERLAY_COLOR,
	type CalendarEventViewModel,
} from './types';

const ST_COLOR_MAP: Record<string, string> = {
	green: 'green',
	blue: 'blue',
	orange: 'orange',
};

/** Default timed todo block length so Day/WeekView can render (height > 0). */
const TODO_TIMED_DURATION_MINUTES = 30;

function normalizeIso(value: string): string {
	return value.includes('T') ? value.replace('T', ' ').slice(0, 19) : value.slice(0, 19);
}

function isMidnight(value: string): boolean {
	const d = dayjs(value);
	return d.isValid() && d.hour() === 0 && d.minute() === 0 && d.second() === 0;
}

export function mapOwnEvent(
	event: CalendarEventDto,
	opts?: { editable?: boolean },
): CalendarEventViewModel {
	return {
		uid: `own-${event.id}`,
		source: 'own',
		calendarId: event.calendar_id ?? undefined,
		title: event.title,
		start: normalizeIso(event.start_at),
		end: normalizeIso(event.end_at),
		allDay: event.all_day,
		color: event.color ?? '#1975d2',
		editable: opts?.editable ?? true,
		payload: event,
	};
}

export function mapTodoDue(item: TodoDueItem): CalendarEventViewModel | null {
	if (!item.due_at) {
		return null;
	}
	const due = dayjs(item.due_at);
	if (!due.isValid()) {
		return null;
	}
	const allDay = isMidnight(item.due_at);
	const start = due.format('YYYY-MM-DD HH:mm:ss');
	const end = allDay
		? start
		: due.add(TODO_TIMED_DURATION_MINUTES, 'minute').format('YYYY-MM-DD HH:mm:ss');
	return {
		uid: `todo-${item.id}`,
		source: 'todo',
		title: item.text,
		start,
		end,
		allDay,
		color: item.list_color || TODO_OVERLAY_COLOR,
		editable: false,
		payload: item,
	};
}

export function mapBoardCardDue(item: BoardDueCard): CalendarEventViewModel | null {
	if (!item.due_date) {
		return null;
	}
	const due = dayjs(item.due_date);
	if (!due.isValid()) {
		return null;
	}
	const allDay = isMidnight(item.due_date);
	const start = due.format('YYYY-MM-DD HH:mm:ss');
	const end = allDay
		? start
		: due.add(TODO_TIMED_DURATION_MINUTES, 'minute').format('YYYY-MM-DD HH:mm:ss');
	return {
		uid: `board-${item.id}`,
		source: 'board',
		title: item.title,
		start,
		end,
		allDay,
		color: item.cover_color || BOARD_OVERLAY_COLOR,
		editable: false,
		payload: item,
	};
}

export function mapSchooltaskEvent(event: SchooltaskCalendarEvent): CalendarEventViewModel {
	return {
		uid: `st-${event.id}`,
		source: 'schooltask',
		title: event.name,
		start: normalizeIso(event.start),
		end: normalizeIso(event.end),
		allDay: false,
		color: ST_COLOR_MAP[event.color ?? 'blue'] ?? event.color ?? SCHOOLTASK_OVERLAY_COLOR,
		editable: false,
		payload: event,
	};
}
