import { Modal, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';

import type { CalendarEvent as SchooltaskCalendarEvent } from '@/core/api/endpoints/schooltaskApi';
import type { TodoDueItem } from '@/core/api/endpoints/todoApi';

import type { CalendarEventViewModel } from '../types';

interface OverlayDetailModalProps {
	event: CalendarEventViewModel | null;
	opened: boolean;
	onClose: () => void;
}

function formatRange(start: string, end: string, allDay: boolean): string {
	if (allDay) {
		return dayjs(start).format('DD.MM.YYYY');
	}
	const s = dayjs(start);
	const e = dayjs(end);
	if (s.isSame(e, 'day')) {
		return `${s.format('DD.MM.YYYY HH:mm')} – ${e.format('HH:mm')}`;
	}
	return `${s.format('DD.MM.YYYY HH:mm')} – ${e.format('DD.MM.YYYY HH:mm')}`;
}

function formatTodoDue(dueAt: string | null | undefined): string {
	if (!dueAt) {
		return '—';
	}
	const d = dayjs(dueAt);
	if (!d.isValid()) {
		return dueAt;
	}
	if (d.hour() === 0 && d.minute() === 0 && d.second() === 0) {
		return d.format('DD.MM.YYYY');
	}
	return d.format('DD.MM.YYYY HH:mm');
}

export function OverlayDetailModal({ event, opened, onClose }: OverlayDetailModalProps) {
	if (!event) {
		return null;
	}

	const title =
		event.source === 'todo'
			? 'Заметка'
			: event.source === 'schooltask'
				? 'Урок'
				: 'Событие';

	return (
		<Modal opened={opened} onClose={onClose} title={title} centered>
			<Stack gap="sm">
				<Text fw={600}>{event.title}</Text>
				<Text size="sm" c="dimmed">
					{event.source === 'todo'
						? `Срок: ${formatTodoDue((event.payload as TodoDueItem).due_at)}`
						: formatRange(event.start, event.end, event.allDay)}
				</Text>
				{event.source === 'todo' ? (
					<>
						<Text size="sm">
							Список:{' '}
							{(event.payload as TodoDueItem).list_title ?? '—'}
						</Text>
						<Text size="sm">
							Статус: {(event.payload as TodoDueItem).done ? 'выполнено' : 'не выполнено'}
						</Text>
					</>
				) : null}
				{event.source === 'schooltask' ? (
					<Text size="sm" c="dimmed">
						{(event.payload as SchooltaskCalendarEvent).name}
					</Text>
				) : null}
			</Stack>
		</Modal>
	);
}
