import { Button, Modal, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';

import type { BoardDueCard } from '@/core/api/endpoints/boardApi';
import type { CalendarEvent as SchooltaskCalendarEvent } from '@/core/api/endpoints/schooltaskApi';
import type { TodoDueItem } from '@/core/api/endpoints/todoApi';
import { useAppManager } from '@/core/appManager/useAppManager';

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
	const launchApp = useAppManager((s) => s.launchApp);

	if (!event) {
		return null;
	}

	const title =
		event.source === 'todo'
			? 'Заметка'
			: event.source === 'board'
				? 'Задача'
				: event.source === 'schooltask'
					? 'Урок'
					: 'Событие';

	const todoPayload = event.source === 'todo' ? (event.payload as TodoDueItem) : null;
	const boardPayload = event.source === 'board' ? (event.payload as BoardDueCard) : null;

	return (
		<Modal opened={opened} onClose={onClose} title={title} centered>
			<Stack gap="sm">
				<Text fw={600}>{event.title}</Text>
				<Text size="sm" c="dimmed">
					{event.source === 'todo'
						? `Срок: ${formatTodoDue(todoPayload?.due_at)}`
						: event.source === 'board'
							? `Срок: ${formatTodoDue(boardPayload?.due_date)}`
							: formatRange(event.start, event.end, event.allDay)}
				</Text>
				{todoPayload ? (
					<>
						<Text size="sm">Список: {todoPayload.list_title ?? '—'}</Text>
						<Text size="sm">Статус: {todoPayload.done ? 'выполнено' : 'не выполнено'}</Text>
						{todoPayload.list_id ? (
							<Button
								size="xs"
								variant="light"
								onClick={() => {
									onClose();
									void launchApp('todo', {
										props: { listId: todoPayload.list_id },
									});
								}}
							>
								Открыть список
							</Button>
						) : null}
					</>
				) : null}
				{boardPayload ? (
					<>
						<Text size="sm">Доска: {boardPayload.board_title ?? '—'}</Text>
						<Text size="sm">Список: {boardPayload.list_title ?? '—'}</Text>
						{boardPayload.board_id ? (
							<Button
								size="xs"
								variant="light"
								onClick={() => {
									onClose();
									void launchApp('board', {
										props: {
											boardId: boardPayload.board_id,
											cardId: boardPayload.id,
										},
									});
								}}
							>
								Открыть карточку
							</Button>
						) : null}
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
