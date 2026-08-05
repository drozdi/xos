import { Alert, Group, Loader, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';

import { calendarApi, type CalendarDto, type CalendarEventDto } from '@/core/api/endpoints/calendarApi';
import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { todoApi } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm';
import {
	useCanReadSchooltaskEvent,
	useCanUpdateSchooltaskEvent,
} from '@/features/schooltask/schooltaskAccess';

import { canUseCalendar } from '../calendarAccess';
import { mapOwnEvent, mapSchooltaskEvent, mapTodoDue } from '../mappers';
import type { CalendarEventViewModel, CalendarViewMode } from '../types';
import {
	OVERLAY_SCHOOLTASK_ID,
	OVERLAY_TODO_ID,
	ownCalendarVisibilityId,
	useCalendarVisibilityStore,
} from '../visibilityStore';
import { CalendarGrid, type CalendarSlotSelection } from './CalendarGrid';
import { CalendarShareModal } from './CalendarShareModal';
import { CalendarSidebar } from './CalendarSidebar';
import { CalendarToolbar } from './CalendarToolbar';
import { EventFormModal } from './EventFormModal';
import { OverlayDetailModal } from './OverlayDetailModal';

const EventTeacherModal = lazy(() =>
	import('@/features/schooltask/EventTeacherModal').then((m) => ({
		default: m.EventTeacherModal,
	})),
);

export function CalendarShell() {
	const queryClient = useQueryClient();
	const canReadSt = useCanReadSchooltaskEvent();
	const canUpdateSt = useCanUpdateSchooltaskEvent();
	const showSchooltaskByRights = canReadSt || canUpdateSt;

	const [view, setView] = useState<CalendarViewMode>('week');
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
	const [range, setRange] = useState<{ start: string; end: string } | null>(null);
	const [schooltaskForbidden, setSchooltaskForbidden] = useState(false);

	const [shareCalendar, setShareCalendar] = useState<CalendarDto | null>(null);
	const [deletingCalendarId, setDeletingCalendarId] = useState<number | null>(null);
	const [formOpened, setFormOpened] = useState(false);
	const [editingEvent, setEditingEvent] = useState<CalendarEventDto | null>(null);
	const [slotDefaults, setSlotDefaults] = useState<CalendarSlotSelection | null>(null);
	const [overlayEvent, setOverlayEvent] = useState<CalendarEventViewModel | null>(null);
	const [teacherEventId, setTeacherEventId] = useState<number | null>(null);

	const hidden = useCalendarVisibilityStore((s) => s.hidden);
	const isVisible = useCallback(
		(id: string) => !hidden.has(id),
		[hidden],
	);

	const calendarsQuery = useQuery({
		queryKey: queryKeys.calendar.calendars,
		queryFn: () => calendarApi.calendars(),
		enabled: canUseCalendar(),
	});

	const calendars = calendarsQuery.data ?? [];
	const visibleOwnIds = useMemo(
		() =>
			calendars
				.filter((c) => isVisible(ownCalendarVisibilityId(c.id)))
				.map((c) => c.id),
		[calendars, isVisible],
	);

	const calendarById = useMemo(() => {
		const map = new Map<number, CalendarDto>();
		for (const c of calendars) {
			map.set(c.id, c);
		}
		return map;
	}, [calendars]);

	const eventsQuery = useQuery({
		queryKey: queryKeys.calendar.events(range ?? { start: '', end: '' }, visibleOwnIds),
		queryFn: () =>
			calendarApi.queryEvents({
				start: range!.start,
				end: range!.end,
				calendar_ids: visibleOwnIds,
			}),
		enabled: canUseCalendar() && range !== null && visibleOwnIds.length > 0,
	});

	const dueQuery = useQuery({
		queryKey: queryKeys.calendar.dueItems(range ?? { start: '', end: '' }),
		queryFn: () => todoApi.dueItems(range!.start, range!.end),
		enabled: canUseCalendar() && range !== null && isVisible(OVERLAY_TODO_ID),
	});

	const showSchooltaskOverlay = showSchooltaskByRights && !schooltaskForbidden;

	const schooltaskQuery = useQuery({
		queryKey: queryKeys.schooltask.teacherEvents(range ?? { start: '', end: '' }),
		queryFn: async () => {
			try {
				return await schooltaskCalendarApi.teacherEvents({
					start: range!.start,
					end: range!.end,
				});
			} catch (error) {
				if (isAxiosError(error) && error.response?.status === 403) {
					setSchooltaskForbidden(true);
					return [];
				}
				throw error;
			}
		},
		enabled:
			canUseCalendar() &&
			range !== null &&
			showSchooltaskOverlay &&
			isVisible(OVERLAY_SCHOOLTASK_ID),
		retry: false,
	});

	const createCalendarMutation = useMutation({
		mutationFn: ({ title, color }: { title: string; color: string }) =>
			calendarApi.createCalendar({ title, color }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars });
			notifications.show({ color: 'green', message: 'Календарь создан' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать календарь' });
		},
	});

	const deleteCalendarMutation = useMutation({
		mutationFn: (id: number) => calendarApi.removeCalendar(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: queryKeys.calendar.calendars });
			void queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
			notifications.show({ color: 'green', message: 'Календарь удалён' });
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить календарь' });
		},
		onSettled: () => {
			setDeletingCalendarId(null);
		},
	});

	const mergedEvents = useMemo(() => {
		const result: CalendarEventViewModel[] = [];

		for (const event of eventsQuery.data ?? []) {
			const cal = event.calendar_id != null ? calendarById.get(event.calendar_id) : undefined;
			if (event.calendar_id != null && !isVisible(ownCalendarVisibilityId(event.calendar_id))) {
				continue;
			}
			result.push(
				mapOwnEvent(event, {
					editable: cal?.can_write ?? false,
				}),
			);
		}

		if (isVisible(OVERLAY_TODO_ID)) {
			for (const item of dueQuery.data ?? []) {
				const mapped = mapTodoDue(item);
				if (mapped) {
					result.push(mapped);
				}
			}
		}

		if (showSchooltaskOverlay && isVisible(OVERLAY_SCHOOLTASK_ID)) {
			for (const event of schooltaskQuery.data ?? []) {
				result.push(mapSchooltaskEvent(event));
			}
		}

		return result;
	}, [
		eventsQuery.data,
		dueQuery.data,
		schooltaskQuery.data,
		calendarById,
		isVisible,
		showSchooltaskOverlay,
	]);

	const defaultCalendarId =
		calendars.find((c) => c.is_owner && c.can_write)?.id ??
		calendars.find((c) => c.can_write)?.id ??
		null;

	const handleRangeChange = useCallback((start: string, end: string) => {
		setRange({ start, end });
	}, []);

	const openCreate = (slot?: CalendarSlotSelection | null) => {
		setEditingEvent(null);
		setSlotDefaults(slot ?? null);
		setFormOpened(true);
	};

	const handleEventClick = (event: CalendarEventViewModel) => {
		if (event.source === 'own') {
			if (!event.editable) {
				setOverlayEvent(event);
				return;
			}
			setEditingEvent(event.payload as CalendarEventDto);
			setSlotDefaults(null);
			setFormOpened(true);
			return;
		}
		if (event.source === 'todo') {
			setOverlayEvent(event);
			return;
		}
		if (event.source === 'schooltask') {
			const st = event.payload as { id: number };
			if (canUpdateSt) {
				setTeacherEventId(st.id);
			} else {
				setOverlayEvent(event);
			}
		}
	};

	if (!canUseCalendar()) {
		return (
			<Alert color="red" title="Доступ запрещён" m="md">
				Войдите в систему, чтобы пользоваться календарём
			</Alert>
		);
	}

	if (calendarsQuery.isLoading) {
		return (
			<Group justify="center" py="xl">
				<Loader size="sm" />
			</Group>
		);
	}

	const isLoading =
		eventsQuery.isFetching || dueQuery.isFetching || schooltaskQuery.isFetching;

	return (
		<Stack gap={0} h="100%" style={{ minHeight: 0 }}>
			<Group align="stretch" gap={0} style={{ flex: 1, minHeight: 0 }} wrap="nowrap">
				<CalendarSidebar
					calendars={calendars}
					showSchooltaskOverlay={showSchooltaskOverlay}
					creating={createCalendarMutation.isPending}
					onCreateCalendar={(title, color) =>
						createCalendarMutation.mutate({ title, color })
					}
					onShare={setShareCalendar}
					onDelete={(calendar) => {
						confirmAction({
							title: 'Удалить календарь?',
							message: `Календарь «${calendar.title}» будет удалён вместе с его событиями.`,
							confirmLabel: 'Удалить',
							confirmColor: 'red',
							onConfirm: async () => {
								setDeletingCalendarId(calendar.id);
								await deleteCalendarMutation.mutateAsync(calendar.id);
							},
						});
					}}
					deletingId={deletingCalendarId}
				/>
				<Stack gap={0} style={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
					<CalendarToolbar
						view={view}
						date={date}
						onViewChange={setView}
						onDateChange={setDate}
						onCreateEvent={() => openCreate(null)}
						canCreate={Boolean(defaultCalendarId)}
					/>
					<CalendarGrid
						view={view}
						date={date}
						events={mergedEvents}
						isLoading={isLoading}
						onDateChange={setDate}
						onRangeChange={handleRangeChange}
						onEventClick={handleEventClick}
						onSlotClick={(slot) => openCreate(slot)}
					/>
				</Stack>
			</Group>

			<EventFormModal
				opened={formOpened}
				onClose={() => {
					setFormOpened(false);
					setEditingEvent(null);
					setSlotDefaults(null);
				}}
				calendars={calendars}
				event={editingEvent}
				initialStart={slotDefaults?.start}
				initialEnd={slotDefaults?.end}
				initialAllDay={slotDefaults?.allDay}
				defaultCalendarId={defaultCalendarId}
			/>

			{shareCalendar ? (
				<CalendarShareModal
					calendar={shareCalendar}
					opened
					onClose={() => setShareCalendar(null)}
					onUpdated={(cal) => setShareCalendar(cal)}
				/>
			) : null}

			<OverlayDetailModal
				event={overlayEvent}
				opened={overlayEvent !== null}
				onClose={() => setOverlayEvent(null)}
			/>

			{teacherEventId !== null ? (
				<Suspense fallback={null}>
					<EventTeacherModal
						eventId={teacherEventId}
						opened
						onClose={() => setTeacherEventId(null)}
						onSaved={() => void schooltaskQuery.refetch()}
					/>
				</Suspense>
			) : null}
		</Stack>
	);
}
