import { Button, Group, SegmentedControl, Text } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconPlus } from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import type { CalendarViewMode } from '../types';

dayjs.locale('ru');

interface CalendarToolbarProps {
	view: CalendarViewMode;
	date: string;
	onViewChange: (view: CalendarViewMode) => void;
	onDateChange: (date: string) => void;
	onCreateEvent?: () => void;
	canCreate?: boolean;
}

function periodTitle(view: CalendarViewMode, date: string): string {
	const d = dayjs(date);
	if (view === 'day') {
		return d.format('D MMMM YYYY, dddd');
	}
	if (view === 'week') {
		const monday = d.day() === 0 ? d.subtract(6, 'day') : d.subtract(d.day() - 1, 'day');
		const sunday = monday.add(6, 'day');
		if (monday.month() === sunday.month()) {
			return `${monday.format('D')} – ${sunday.format('D MMMM YYYY')}`;
		}
		if (monday.year() === sunday.year()) {
			return `${monday.format('D MMM')} – ${sunday.format('D MMM YYYY')}`;
		}
		return `${monday.format('D MMM YYYY')} – ${sunday.format('D MMM YYYY')}`;
	}
	return d.format('MMMM YYYY');
}

function shiftDate(view: CalendarViewMode, date: string, dir: -1 | 1): string {
	const d = dayjs(date);
	if (view === 'day') {
		return d.add(dir, 'day').format('YYYY-MM-DD');
	}
	if (view === 'week') {
		return d.add(dir * 7, 'day').format('YYYY-MM-DD');
	}
	return d.add(dir, 'month').format('YYYY-MM-DD');
}

export function CalendarToolbar({
	view,
	date,
	onViewChange,
	onDateChange,
	onCreateEvent,
	canCreate = true,
}: CalendarToolbarProps) {
	return (
		<Group
			justify="space-between"
			wrap="wrap"
			px="md"
			py="sm"
			gap="sm"
			style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
		>
			<Group gap="xs">
				<Button variant="default" size="xs" onClick={() => onDateChange(dayjs().format('YYYY-MM-DD'))}>
					Сегодня
				</Button>
				<Button
					variant="subtle"
					size="xs"
					px={6}
					aria-label="Назад"
					onClick={() => onDateChange(shiftDate(view, date, -1))}
				>
					<IconChevronLeft size={16} />
				</Button>
				<Button
					variant="subtle"
					size="xs"
					px={6}
					aria-label="Вперёд"
					onClick={() => onDateChange(shiftDate(view, date, 1))}
				>
					<IconChevronRight size={16} />
				</Button>
				<Text fw={600} size="sm" miw={180}>
					{periodTitle(view, date)}
				</Text>
			</Group>
			<Group gap="sm">
				<SegmentedControl
					size="xs"
					value={view}
					onChange={(v) => onViewChange(v as CalendarViewMode)}
					data={[
						{ label: 'День', value: 'day' },
						{ label: 'Неделя', value: 'week' },
						{ label: 'Месяц', value: 'month' },
					]}
				/>
				{canCreate && onCreateEvent ? (
					<Button size="xs" leftSection={<IconPlus size={14} />} onClick={onCreateEvent}>
						Событие
					</Button>
				) : null}
			</Group>
		</Group>
	);
}
