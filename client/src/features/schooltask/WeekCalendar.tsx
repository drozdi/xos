import { Button, Spin } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import type { CalendarEvent } from '@/core/api/endpoints/schooltaskApi';

const VISIBLE_WEEK_DAYS = 6;
const HOUR_START = 7;
const HOUR_END = 20;
const HOUR_HEIGHT = 48;
const TOTAL_HOURS = HOUR_END - HOUR_START;

const COLOR_MAP: Record<string, string> = {
	green: '#52c41a',
	blue: '#1677ff',
	orange: '#fa8c16',
};

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/** Как подписи дней в шапке (Пн / ДД.ММ). */
const LABEL_COLOR = 'var(--xos-shell-dimmed, rgba(0,0,0,0.45))';
const GRID_LINE_COLOR = 'var(--xos-shell-dimmed, rgba(0,0,0,0.45))';
const NOW_LINE_COLOR = '#ff4d4f';

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

/** Monday-based start of week. */
function getWeekStart(date: Dayjs): Dayjs {
	const day = date.day(); // 0 = Sun … 6 = Sat
	const diff = day === 0 ? -6 : 1 - day;
	return date.add(diff, 'day').startOf('day');
}

function getVisibleWeekRange(anchor: Dayjs) {
	const weekStart = getWeekStart(anchor);
	const weekEnd = weekStart.add(VISIBLE_WEEK_DAYS - 1, 'day').endOf('day');
	return { start: weekStart.toDate(), end: weekEnd.toDate(), weekStart };
}

function minutesFromDayStart(value: Dayjs): number {
	return value.hour() * 60 + value.minute() + value.second() / 60;
}

function eventStyle(event: CalendarEvent, day: Dayjs): CSSProperties | null {
	const start = dayjs(normalizeDateTime(event.start));
	const end = dayjs(normalizeDateTime(event.end));
	if (!start.isSame(day, 'day')) {
		return null;
	}

	const rangeStartMin = HOUR_START * 60;
	const rangeEndMin = HOUR_END * 60;
	const startMin = Math.max(minutesFromDayStart(start), rangeStartMin);
	const endMin = Math.min(minutesFromDayStart(end), rangeEndMin);
	if (endMin <= startMin) {
		return null;
	}

	const top = ((startMin - rangeStartMin) / 60) * HOUR_HEIGHT;
	const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 16);
	const bg = COLOR_MAP[event.color ?? 'blue'] ?? COLOR_MAP.blue;

	return {
		position: 'absolute',
		left: 4,
		right: 4,
		top,
		height,
		background: bg,
		color: '#fff',
		borderRadius: 4,
		padding: '2px 6px',
		fontSize: 12,
		lineHeight: 1.3,
		overflow: 'hidden',
		cursor: 'pointer',
		zIndex: 2,
		boxSizing: 'border-box',
	};
}

function useNowMinutes() {
	const [now, setNow] = useState(() => dayjs());

	useEffect(() => {
		const id = window.setInterval(() => setNow(dayjs()), 30_000);
		return () => window.clearInterval(id);
	}, []);

	return now;
}

export function WeekCalendar({
	events,
	isLoading,
	onRangeChange,
	onEventClick,
	onSlotClick,
}: WeekCalendarProps) {
	const [anchor, setAnchor] = useState(() => dayjs());
	const now = useNowMinutes();

	const { days, rangeLabel } = useMemo(() => {
		const { weekStart: start } = getVisibleWeekRange(anchor);
		const dayList = Array.from({ length: VISIBLE_WEEK_DAYS }, (_, i) => start.add(i, 'day'));
		const labelEnd = dayList[VISIBLE_WEEK_DAYS - 1] ?? start;
		return {
			days: dayList,
			rangeLabel: `${start.format('DD.MM')} — ${labelEnd.format('DD.MM.YYYY')}`,
		};
	}, [anchor]);

	const hours = useMemo(
		() => Array.from({ length: TOTAL_HOURS }, (_, i) => HOUR_START + i),
		[],
	);

	useEffect(() => {
		const { start, end } = getVisibleWeekRange(anchor);
		onRangeChange(start, end);
	}, [anchor, onRangeChange]);

	const eventsByDay = useMemo(() => {
		const map = new Map<string, CalendarEvent[]>();
		for (const day of days) {
			map.set(day.format('YYYY-MM-DD'), []);
		}
		for (const event of events) {
			const key = dayjs(normalizeDateTime(event.start)).format('YYYY-MM-DD');
			const list = map.get(key);
			if (list) {
				list.push(event);
			}
		}
		return map;
	}, [days, events]);

	const goPrev = useCallback(() => setAnchor((d) => d.subtract(1, 'week')), []);
	const goNext = useCallback(() => setAnchor((d) => d.add(1, 'week')), []);
	const goToday = useCallback(() => setAnchor(dayjs()), []);

	const handleSlotClick = useCallback(
		(day: Dayjs, hour: number) => {
			if (!onSlotClick) {
				return;
			}
			const start = day.hour(hour).minute(0).second(0);
			const end = start.add(1, 'hour');
			onSlotClick({
				start: start.format('YYYY-MM-DD HH:mm:ss'),
				end: end.format('YYYY-MM-DD HH:mm:ss'),
			});
		},
		[onSlotClick],
	);

	const todayKey = now.format('YYYY-MM-DD');
	const gridHeight = TOTAL_HOURS * HOUR_HEIGHT;

	const nowLineTop = useMemo(() => {
		const minutes = minutesFromDayStart(now);
		const rangeStartMin = HOUR_START * 60;
		const rangeEndMin = HOUR_END * 60;
		if (minutes < rangeStartMin || minutes > rangeEndMin) {
			return null;
		}
		return ((minutes - rangeStartMin) / 60) * HOUR_HEIGHT;
	}, [now]);

	return (
		<div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
			{isLoading ? (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						zIndex: 10,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						background: 'color-mix(in srgb, var(--xos-window-bg, #fff) 55%, transparent)',
					}}
				>
					<Spin />
				</div>
			) : null}

			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					padding: '8px 0',
					flexShrink: 0,
					color: 'var(--xos-window-text, inherit)',
				}}
			>
				<Button size="small" onClick={goPrev}>
					Назад
				</Button>
				<Button size="small" onClick={goToday}>
					Сегодня
				</Button>
				<Button size="small" onClick={goNext}>
					Вперёд
				</Button>
				<span style={{ marginLeft: 8, fontWeight: 500 }}>{rangeLabel}</span>
			</div>

			<div style={{ flex: 1, minHeight: 320, overflow: 'auto' }}>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: `56px repeat(${VISIBLE_WEEK_DAYS}, 1fr)`,
						minWidth: 640,
						color: 'var(--xos-window-text, inherit)',
					}}
				>
					<div style={{ borderBottom: `1px solid ${GRID_LINE_COLOR}` }} />
					{days.map((day, index) => {
						const key = day.format('YYYY-MM-DD');
						const isToday = key === todayKey;
						return (
							<div
								key={key}
								style={{
									textAlign: 'center',
									padding: '8px 4px',
									borderBottom: `1px solid ${GRID_LINE_COLOR}`,
									borderLeft: `1px solid ${GRID_LINE_COLOR}`,
									fontWeight: isToday ? 600 : 400,
									background: isToday ? 'rgba(22,119,255,0.06)' : undefined,
								}}
							>
								<div style={{ fontSize: 12, color: LABEL_COLOR }}>{WEEKDAY_LABELS[index]}</div>
								<div>{day.format('DD.MM')}</div>
							</div>
						);
					})}

					<div style={{ position: 'relative', height: gridHeight }}>
						{hours.map((hour) => (
							<div
								key={hour}
								style={{
									position: 'absolute',
									top: (hour - HOUR_START) * HOUR_HEIGHT,
									right: 8,
									fontSize: 12,
									color: LABEL_COLOR,
									transform: 'translateY(-50%)',
								}}
							>
								{`${String(hour).padStart(2, '0')}:00`}
							</div>
						))}
					</div>

					{days.map((day) => {
						const key = day.format('YYYY-MM-DD');
						const dayEvents = eventsByDay.get(key) ?? [];
						const isToday = key === todayKey;
						return (
							<div
								key={key}
								style={{
									position: 'relative',
									height: gridHeight,
									borderLeft: `1px solid ${GRID_LINE_COLOR}`,
									background: isToday ? 'rgba(22,119,255,0.03)' : undefined,
								}}
							>
								{hours.map((hour) => (
									<div
										key={hour}
										role={onSlotClick ? 'button' : undefined}
										tabIndex={onSlotClick ? 0 : undefined}
										onClick={() => handleSlotClick(day, hour)}
										onKeyDown={(e) => {
											if (e.key === 'Enter' || e.key === ' ') {
												e.preventDefault();
												handleSlotClick(day, hour);
											}
										}}
										style={{
											position: 'absolute',
											left: 0,
											right: 0,
											top: (hour - HOUR_START) * HOUR_HEIGHT,
											height: HOUR_HEIGHT,
											borderTop: `1px solid ${GRID_LINE_COLOR}`,
											cursor: onSlotClick ? 'pointer' : 'default',
											boxSizing: 'border-box',
										}}
									/>
								))}

								{isToday && nowLineTop != null ? (
									<div
										aria-hidden
										style={{
											position: 'absolute',
											left: 0,
											right: 0,
											top: nowLineTop,
											height: 0,
											borderTop: `2px solid ${NOW_LINE_COLOR}`,
											zIndex: 3,
											pointerEvents: 'none',
										}}
									>
										<span
											style={{
												position: 'absolute',
												left: -4,
												top: -5,
												width: 8,
												height: 8,
												borderRadius: '50%',
												background: NOW_LINE_COLOR,
											}}
										/>
									</div>
								) : null}

								{dayEvents.map((event) => {
									const style = eventStyle(event, day);
									if (!style) {
										return null;
									}
									const interactive = Boolean(onEventClick);
									return (
										<div
											key={event.id}
											role={interactive ? 'button' : undefined}
											tabIndex={interactive ? 0 : undefined}
											style={{
												...style,
												cursor: interactive ? 'pointer' : 'default',
											}}
											title={event.name}
											onClick={
												interactive
													? (e) => {
															e.stopPropagation();
															onEventClick?.(event);
														}
													: undefined
											}
											onKeyDown={
												interactive
													? (e) => {
															if (e.key === 'Enter' || e.key === ' ') {
																e.preventDefault();
																e.stopPropagation();
																onEventClick?.(event);
															}
														}
													: undefined
											}
										>
											{event.name}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export function formatCalendarRange(start: Date, end: Date) {
	return {
		start: dayjs(start).format('YYYY-MM-DD HH:mm:ss'),
		end: dayjs(end).format('YYYY-MM-DD HH:mm:ss'),
	};
}
