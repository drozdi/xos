import {
	Box,
	Group,
	Loader,
	Popover,
	ScrollArea,
	Stack,
	Text,
	UnstyledButton,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useEffect, useMemo, useState } from 'react';

import { useAppManager } from '@/core/appManager/useAppManager';
import { boardApi } from '@/core/api/endpoints/boardApi';
import { calendarApi } from '@/core/api/endpoints/calendarApi';
import { todoApi } from '@/core/api/endpoints/todoApi';
import { queryKeys } from '@/core/api/queryKeys';
import { dayjs } from '@/core/dates/dayjs';
import { useDateSettings } from '@/core/dates/DatesSettingsProvider';
import { loadWeatherPrefs } from '@/core/desktop/widgetPrefs';
import { canUseBoard } from '@/features/board/boardAccess';
import { canUseCalendar } from '@/features/calendar/calendarAccess';
import { mapBoardCardDue, mapOwnEvent, mapTodoDue } from '@/features/calendar/mappers';
import type { CalendarEventViewModel } from '@/features/calendar/types';
import {
	OVERLAY_BOARD_ID,
	OVERLAY_TODO_ID,
	hydrateCalendarVisibility,
	ownCalendarVisibilityId,
	useCalendarVisibilityStore,
} from '@/features/calendar/visibilityStore';
import {
	describeWeather,
	fetchWeather,
	geocodeCity,
	readCoordsFromGeolocation,
	type WeatherSnapshot,
} from '@/apps/widget-weather/weatherApi';

type Range = { start: string; end: string };

function monthGridRange(month: string, weekStartsOn: 0 | 1): Range {
	const startOfMonth = dayjs(month).startOf('month');
	const offset = (startOfMonth.day() - weekStartsOn + 7) % 7;
	const gridStart = startOfMonth.subtract(offset, 'day').startOf('day');
	return {
		start: gridStart.format('YYYY-MM-DD HH:mm:ss'),
		end: gridStart.add(41, 'day').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
	};
}

function dayRange(day: string): Range {
	const date = dayjs(day);
	return {
		start: date.startOf('day').format('YYYY-MM-DD HH:mm:ss'),
		end: date.endOf('day').format('YYYY-MM-DD HH:mm:ss'),
	};
}

function rangeContains(range: Range, day: string): boolean {
	const date = dayjs(day);
	return !date.isBefore(dayjs(range.start)) && !date.isAfter(dayjs(range.end));
}

function eventTouchesDay(
	event: Pick<CalendarEventViewModel, 'start' | 'end' | 'allDay'>,
	dayKey: string,
): boolean {
	const day = dayjs(dayKey);
	if (!day.isValid()) {
		return false;
	}
	const start = dayjs(event.start);
	if (!start.isValid()) {
		return false;
	}
	if (event.allDay) {
		const end = dayjs(event.end);
		const endKey = end.isValid() ? end.format('YYYY-MM-DD') : start.format('YYYY-MM-DD');
		return dayKey >= start.format('YYYY-MM-DD') && dayKey <= endKey;
	}
	const end = dayjs(event.end);
	const endAt = end.isValid() && end.isAfter(start) ? end : start.add(1, 'minute');
	return start.isBefore(day.endOf('day')) && endAt.isAfter(day.startOf('day'));
}

async function emptyOnForbidden<T>(task: () => Promise<T[]>): Promise<T[]> {
	try {
		return await task();
	} catch (error) {
		if (isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
			return [];
		}
		throw error;
	}
}

function useTaskbarEvents(range: Range | null, enabled: boolean) {
	const hidden = useCalendarVisibilityStore((s) => s.hidden);
	const calendarAllowed = canUseCalendar();
	const todoAllowed = !hidden.has(OVERLAY_TODO_ID);
	const boardAllowed = canUseBoard() && !hidden.has(OVERLAY_BOARD_ID);

	const calendarsQuery = useQuery({
		queryKey: queryKeys.calendar.calendars,
		queryFn: () => emptyOnForbidden(() => calendarApi.calendars()),
		enabled: enabled && calendarAllowed,
		staleTime: 60_000,
	});

	const visibleOwnIds = useMemo(
		() =>
			(calendarsQuery.data ?? [])
				.filter((calendar) => !hidden.has(ownCalendarVisibilityId(calendar.id)))
				.map((calendar) => calendar.id),
		[calendarsQuery.data, hidden],
	);

	const eventsQuery = useQuery({
		queryKey: queryKeys.calendar.events(range ?? { start: '', end: '' }, visibleOwnIds),
		queryFn: () =>
			emptyOnForbidden(() =>
				calendarApi.queryEvents({
					start: range!.start,
					end: range!.end,
					calendar_ids: visibleOwnIds,
				}),
			),
		enabled: enabled && calendarAllowed && range !== null && visibleOwnIds.length > 0,
		staleTime: 30_000,
	});

	const dueQuery = useQuery({
		queryKey: queryKeys.calendar.dueItems(range ?? { start: '', end: '' }),
		queryFn: () => emptyOnForbidden(() => todoApi.dueItems(range!.start, range!.end)),
		enabled: enabled && todoAllowed && range !== null,
		staleTime: 30_000,
	});

	const boardQuery = useQuery({
		queryKey: queryKeys.calendar.boardDueCards(range ?? { start: '', end: '' }),
		queryFn: () => emptyOnForbidden(() => boardApi.dueCards(range!.start, range!.end)),
		enabled: enabled && boardAllowed && range !== null,
		staleTime: 30_000,
	});

	const events = useMemo(() => {
		const result: CalendarEventViewModel[] = [];
		const calendarById = new Map((calendarsQuery.data ?? []).map((calendar) => [calendar.id, calendar]));
		for (const event of eventsQuery.data ?? []) {
			if (event.calendar_id != null && hidden.has(ownCalendarVisibilityId(event.calendar_id))) {
				continue;
			}
			const calendar = event.calendar_id != null ? calendarById.get(event.calendar_id) : undefined;
			result.push(mapOwnEvent(event, { editable: calendar?.can_write ?? false }));
		}
		if (todoAllowed) {
			for (const item of dueQuery.data ?? []) {
				const mapped = mapTodoDue(item);
				if (mapped) {
					result.push(mapped);
				}
			}
		}
		if (boardAllowed) {
			for (const item of boardQuery.data ?? []) {
				const mapped = mapBoardCardDue(item);
				if (mapped) {
					result.push(mapped);
				}
			}
		}
		return result;
	}, [
		boardAllowed,
		boardQuery.data,
		calendarsQuery.data,
		dueQuery.data,
		eventsQuery.data,
		hidden,
		todoAllowed,
	]);

	const isLoading =
		(enabled && calendarAllowed && calendarsQuery.isLoading) ||
		eventsQuery.isLoading ||
		dueQuery.isLoading ||
		boardQuery.isLoading;
	const isError = eventsQuery.isError || dueQuery.isError || boardQuery.isError;

	return { events, isLoading, isError };
}

async function loadTaskbarWeather(): Promise<WeatherSnapshot> {
	const prefs = await loadWeatherPrefs();
	if (prefs.city.trim()) {
		const place = await geocodeCity(prefs.city);
		if (!place) {
			throw new Error('Город не найден');
		}
		return fetchWeather(place.lat, place.lon, place.name, prefs.unit);
	}
	const coords = await readCoordsFromGeolocation();
	return fetchWeather(coords.lat, coords.lon, 'Рядом', prefs.unit);
}

function TaskbarWeather() {
	const query = useQuery({
		queryKey: ['taskbar', 'weather'],
		queryFn: loadTaskbarWeather,
		staleTime: 10 * 60 * 1000,
		retry: false,
	});

	if (query.isLoading) {
		return <Loader size="xs" />;
	}
	if (!query.data) {
		return (
			<Text size="xs" c="dimmed" ta="right">
				Нет данных о погоде
			</Text>
		);
	}

	const place = query.data.placeName.split(',')[0] ?? query.data.placeName;
	return (
		<Stack gap={0} align="flex-end" maw={140}>
			<Text fw={600} style={{ fontSize: 28, lineHeight: 1 }}>
				{Math.round(query.data.temperature)}°
			</Text>
			<Text size="xs" c="dimmed" ta="right" lineClamp={2}>
				{describeWeather(query.data.weatherCode)}
			</Text>
			<Text size="xs" c="dimmed" ta="right" lineClamp={1}>
				{place}
			</Text>
		</Stack>
	);
}

function eventTimeLabel(event: CalendarEventViewModel): string {
	if (event.allDay) {
		return 'Весь день';
	}
	const start = dayjs(event.start);
	if (!start.isValid()) {
		return '';
	}
	const end = dayjs(event.end);
	if (!end.isValid() || !end.isAfter(start)) {
		return start.format('HH:mm');
	}
	return `${start.format('HH:mm')}–${end.format('HH:mm')}`;
}

function isTodoDone(event: CalendarEventViewModel): boolean {
	return event.source === 'todo' && 'done' in event.payload && Boolean(event.payload.done);
}

function TaskbarClockPanel({
	now,
	month,
	selected,
	onMonthChange,
	onSelect,
	onClose,
}: {
	now: ReturnType<typeof dayjs>;
	month: string;
	selected: string;
	onMonthChange: (month: string) => void;
	onSelect: (day: string) => void;
	onClose: () => void;
}) {
	const { locale } = useDateSettings();
	const launchApp = useAppManager((s) => s.launchApp);
	const weekStartsOn: 0 | 1 = locale === 'ru' ? 1 : 0;
	const grid = useMemo(() => monthGridRange(month, weekStartsOn), [month, weekStartsOn]);
	const selectedInsideGrid = rangeContains(grid, selected);
	const gridSources = useTaskbarEvents(grid, true);
	const daySources = useTaskbarEvents(selectedInsideGrid ? null : dayRange(selected), !selectedInsideGrid);

	const events = useMemo(() => {
		const byId = new Map<string, CalendarEventViewModel>();
		for (const event of gridSources.events) {
			byId.set(event.uid, event);
		}
		for (const event of daySources.events) {
			byId.set(event.uid, event);
		}
		return [...byId.values()];
	}, [daySources.events, gridSources.events]);

	const markedDays = useMemo(() => {
		const days = new Set<string>();
		let cursor = dayjs(grid.start).startOf('day');
		const end = dayjs(grid.end).startOf('day');
		while (!cursor.isAfter(end)) {
			const key = cursor.format('YYYY-MM-DD');
			if (events.some((event) => eventTouchesDay(event, key))) {
				days.add(key);
			}
			cursor = cursor.add(1, 'day');
		}
		return days;
	}, [events, grid.end, grid.start]);

	const dayEvents = useMemo(
		() =>
			events
				.filter((event) => eventTouchesDay(event, selected))
				.sort((a, b) => {
					if (a.allDay !== b.allDay) {
						return a.allDay ? -1 : 1;
					}
					return a.start.localeCompare(b.start);
				}),
		[events, selected],
	);

	const waiting = (gridSources.isLoading || daySources.isLoading) && dayEvents.length === 0;
	const failed = (gridSources.isError || daySources.isError) && dayEvents.length === 0 && !waiting;
	const selectedLabel = dayjs(selected).locale(locale).isSame(now, 'day')
		? `Сегодня, ${dayjs(selected).locale(locale).format('D MMMM')}`
		: dayjs(selected).locale(locale).format('dddd, D MMMM');

	const openEvent = (event: CalendarEventViewModel) => {
		switch (event.source) {
			case 'own':
				void launchApp('calendar', { props: { focusDate: selected } });
				break;
			case 'todo':
				void launchApp('todo');
				break;
			case 'board':
				void launchApp('board');
				break;
			case 'schooltask':
				void launchApp('schooltask-calendar');
				break;
			default: {
				const unreachable: never = event.source;
				return unreachable;
			}
		}
		onClose();
	};

	return (
		<Stack gap="sm">
			<Group justify="space-between" align="flex-start" wrap="nowrap">
				<Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
					<Text fw={600} style={{ fontSize: 32, lineHeight: 1 }}>
						{now.locale(locale).format('HH:mm')}
					</Text>
					<Text size="sm" lineClamp={2}>
						{now.locale(locale).format('D MMMM, dddd')}
					</Text>
				</Stack>
				<TaskbarWeather />
			</Group>
			<Calendar
				size="sm"
				fullWidth
				highlightToday
				date={month}
				onDateChange={onMonthChange}
				getDayProps={(date) => ({
					selected: date === selected,
					onClick: () => onSelect(date),
				})}
				renderDay={(date) => (
					<span style={{ position: 'relative' }}>
						{dayjs(date).date()}
						{markedDays.has(date) ? (
							<span
								style={{
									position: 'absolute',
									left: '50%',
									bottom: -7,
									width: 4,
									height: 4,
									borderRadius: 99,
									background: 'currentColor',
									transform: 'translateX(-50%)',
								}}
							/>
						) : null}
					</span>
				)}
			/>
			<Stack gap={6}>
				<Text size="sm" fw={600}>
					{selectedLabel}
				</Text>
				{waiting ? (
					<Group justify="center" py="xs">
						<Loader size="xs" />
					</Group>
				) : failed ? (
					<Text size="sm" c="dimmed">
						Не удалось загрузить события
					</Text>
				) : dayEvents.length === 0 ? (
					<Text size="sm" c="dimmed">
						Нет событий
					</Text>
				) : (
					<ScrollArea.Autosize mah={160} type="auto">
						<Stack gap={4}>
							{dayEvents.map((event) => (
								<UnstyledButton
									key={event.uid}
									onClick={() => openEvent(event)}
									style={{ borderRadius: 6, padding: '4px 6px' }}
								>
									<Group gap={8} wrap="nowrap" align="flex-start">
										<Box
											w={8}
											h={8}
											mt={6}
											style={{ borderRadius: 99, background: event.color, flexShrink: 0 }}
										/>
										<Stack gap={0} style={{ minWidth: 0 }}>
											<Text
												size="sm"
												lineClamp={2}
												td={isTodoDone(event) ? 'line-through' : undefined}
												c={isTodoDone(event) ? 'dimmed' : undefined}
											>
												{event.title}
											</Text>
											<Text size="xs" c="dimmed">
												{eventTimeLabel(event)}
											</Text>
										</Stack>
									</Group>
								</UnstyledButton>
							))}
						</Stack>
					</ScrollArea.Autosize>
				)}
			</Stack>
		</Stack>
	);
}

export function TaskbarClock() {
	const [now, setNow] = useState(() => dayjs());
	const [opened, setOpened] = useState(false);
	const [month, setMonth] = useState(() => dayjs().format('YYYY-MM-DD'));
	const [selected, setSelected] = useState(() => dayjs().format('YYYY-MM-DD'));

	useEffect(() => {
		setNow(dayjs());
		let timer = 0;
		const schedule = () => {
			const delay = opened ? 1000 : Math.max(1000, 60_000 - (Date.now() % 60_000));
			timer = window.setTimeout(() => {
				setNow(dayjs());
				schedule();
			}, delay);
		};
		schedule();
		return () => window.clearTimeout(timer);
	}, [opened]);

	useEffect(() => {
		if (opened) {
			hydrateCalendarVisibility();
		}
	}, [opened]);

	return (
		<Popover
			opened={opened}
			onChange={setOpened}
			position="top-end"
			width={360}
			shadow="md"
			withinPortal
			zIndex={2000}
		>
			<Popover.Target>
				<UnstyledButton
					aria-label="Календарь"
					aria-expanded={opened}
					onClick={() => {
						if (!opened) {
							const today = dayjs().format('YYYY-MM-DD');
							setMonth(today);
							setSelected(today);
						}
						setOpened((value) => !value);
					}}
					style={{
						borderRadius: 6,
						padding: '2px 8px',
						background: opened ? 'var(--mantine-color-default-hover)' : undefined,
					}}
				>
					<Text size="xs">{now.format('HH:mm')}</Text>
				</UnstyledButton>
			</Popover.Target>
			<Popover.Dropdown p="sm">
				{opened ? (
					<TaskbarClockPanel
						now={now}
						month={month}
						selected={selected}
						onMonthChange={setMonth}
						onSelect={setSelected}
						onClose={() => setOpened(false)}
					/>
				) : null}
			</Popover.Dropdown>
		</Popover>
	);
}
