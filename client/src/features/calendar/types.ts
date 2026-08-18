import type { BoardDueCard } from '@/core/api/endpoints/boardApi';
import type { CalendarEventDto } from '@/core/api/endpoints/calendarApi';
import type { CalendarEvent as SchooltaskCalendarEvent } from '@/core/api/endpoints/schooltaskApi';
import type { TodoDueItem } from '@/core/api/endpoints/todoApi';

export type CalendarEventSource = 'own' | 'todo' | 'schooltask' | 'board';

export type CalendarEventViewModel = {
	uid: string;
	source: CalendarEventSource;
	calendarId?: number;
	title: string;
	start: string;
	end: string;
	allDay: boolean;
	color: string;
	editable: boolean;
	payload: CalendarEventDto | TodoDueItem | SchooltaskCalendarEvent | BoardDueCard;
};

export type CalendarViewMode = 'day' | 'week' | 'month';

export const OVERLAY_TODO_ID = 'overlay:todo' as const;
export const OVERLAY_SCHOOLTASK_ID = 'overlay:schooltask' as const;
export const OVERLAY_BOARD_ID = 'overlay:board' as const;

export type VisibilityId =
	| typeof OVERLAY_TODO_ID
	| typeof OVERLAY_SCHOOLTASK_ID
	| typeof OVERLAY_BOARD_ID
	| `own:${number}`;

export const TODO_OVERLAY_COLOR = '#78909c';
export const SCHOOLTASK_OVERLAY_COLOR = '#1975d2';
export const BOARD_OVERLAY_COLOR = '#5c6bc0';
