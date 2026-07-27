import {
	Button,
	Checkbox,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import {
	calendarApi,
	type CalendarDto,
	type CalendarEventDto,
} from '@/core/api/endpoints/calendarApi';
import { queryKeys } from '@/core/api/queryKeys';
import { DateTimeField } from '@/core/dates/DateTimeField';

interface EventFormModalProps {
	opened: boolean;
	onClose: () => void;
	calendars: CalendarDto[];
	event?: CalendarEventDto | null;
	initialStart?: string;
	initialEnd?: string;
	initialAllDay?: boolean;
	defaultCalendarId?: number | null;
}

function toApiDateTime(value: string | null | undefined): string | undefined {
	if (!value) {
		return undefined;
	}
	return dayjs(value).format('YYYY-MM-DDTHH:mm:ss');
}

export function EventFormModal({
	opened,
	onClose,
	calendars,
	event,
	initialStart,
	initialEnd,
	initialAllDay,
	defaultCalendarId,
}: EventFormModalProps) {
	const queryClient = useQueryClient();
	const writable = useMemo(() => calendars.filter((c) => c.can_write), [calendars]);
	const isEdit = Boolean(event?.id);

	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [calendarId, setCalendarId] = useState<string | null>(null);
	const [allDay, setAllDay] = useState(false);
	const [start, setStart] = useState<string | null>(null);
	const [end, setEnd] = useState<string | null>(null);
	const [allDayDate, setAllDayDate] = useState<string | null>(null);

	useEffect(() => {
		if (!opened) {
			return;
		}
		if (event) {
			setTitle(event.title);
			setDescription(event.description ?? '');
			setCalendarId(event.calendar_id != null ? String(event.calendar_id) : null);
			setAllDay(event.all_day);
			setStart(event.start_at);
			setEnd(event.end_at);
			setAllDayDate(dayjs(event.start_at).format('YYYY-MM-DD'));
			return;
		}
		setTitle('');
		setDescription('');
		setCalendarId(
			defaultCalendarId != null
				? String(defaultCalendarId)
				: writable[0]
					? String(writable[0].id)
					: null,
		);
		setAllDay(Boolean(initialAllDay));
		setStart(initialStart ?? dayjs().format('YYYY-MM-DDTHH:mm:ss'));
		setEnd(initialEnd ?? dayjs().add(1, 'hour').format('YYYY-MM-DDTHH:mm:ss'));
		setAllDayDate(dayjs(initialStart ?? undefined).format('YYYY-MM-DD'));
	}, [opened, event, initialStart, initialEnd, initialAllDay, defaultCalendarId, writable]);

	const invalidate = () => {
		void queryClient.invalidateQueries({ queryKey: ['calendar', 'events'] });
	};

	const saveMutation = useMutation({
		mutationFn: async () => {
			const calId = Number(calendarId);
			if (!title.trim() || !calId) {
				throw new Error('validation');
			}
			let startAt: string;
			let endAt: string;
			if (allDay) {
				const day = allDayDate ?? dayjs().format('YYYY-MM-DD');
				startAt = `${day}T00:00:00`;
				endAt = `${day}T23:59:59`;
			} else {
				startAt = toApiDateTime(start) ?? '';
				endAt = toApiDateTime(end) ?? '';
			}
			const payload = {
				calendar_id: calId,
				title: title.trim(),
				description: description.trim() || null,
				start_at: startAt,
				end_at: endAt,
				all_day: allDay,
			};
			if (isEdit && event) {
				return calendarApi.updateEvent(event.id, payload);
			}
			return calendarApi.createEvent(payload);
		},
		onSuccess: () => {
			invalidate();
			notifications.show({
				color: 'green',
				message: isEdit ? 'Событие сохранено' : 'Событие создано',
			});
			onClose();
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось сохранить событие' });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: async () => {
			if (!event) {
				throw new Error('no event');
			}
			await calendarApi.removeEvent(event.id);
		},
		onSuccess: () => {
			invalidate();
			notifications.show({ color: 'green', message: 'Событие удалено' });
			onClose();
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось удалить событие' });
		},
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isEdit ? 'Редактировать событие' : 'Новое событие'}
			centered
		>
			<Stack gap="sm">
				<TextInput
					label="Название"
					value={title}
					onChange={(e) => setTitle(e.currentTarget.value)}
					required
				/>
				<Select
					label="Календарь"
					data={writable.map((c) => ({ value: String(c.id), label: c.title }))}
					value={calendarId}
					onChange={setCalendarId}
					required
				/>
				<Checkbox
					label="Весь день"
					checked={allDay}
					onChange={(e) => setAllDay(e.currentTarget.checked)}
				/>
				{allDay ? (
					<DatePickerInput
						label="Дата"
						value={allDayDate}
						onChange={(v) => setAllDayDate(v)}
						valueFormat="DD.MM.YYYY"
					/>
				) : (
					<>
						<DateTimeField label="Начало" value={start} onChange={setStart} />
						<DateTimeField label="Конец" value={end} onChange={setEnd} />
					</>
				)}
				<Textarea
					label="Описание"
					value={description}
					onChange={(e) => setDescription(e.currentTarget.value)}
					minRows={2}
				/>
				<Group justify="space-between">
					{isEdit ? (
						<Button
							color="red"
							variant="light"
							loading={deleteMutation.isPending}
							onClick={() => deleteMutation.mutate()}
						>
							Удалить
						</Button>
					) : (
						<span />
					)}
					<Group>
						<Button variant="default" onClick={onClose}>
							Отмена
						</Button>
						<Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
							Сохранить
						</Button>
					</Group>
				</Group>
				{writable.length === 0 ? (
					<Text size="sm" c="dimmed">
						Нет календарей с правом записи
					</Text>
				) : null}
			</Stack>
		</Modal>
	);
}
