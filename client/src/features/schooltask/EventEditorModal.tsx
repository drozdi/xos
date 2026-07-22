import { Button, Group, Modal, Select, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import {
	schooltaskCalendarApi,
	schooltaskClassApi,
	type EditorEventDetail,
	type EditorEventPayload,
} from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { confirmAction } from '@/core/confirm/confirmAction';
import { DateTimeField } from '@/core/dates/DateTimeField';
import { applyLessonTemplate } from '@/features/schooltask/lessonTemplates';

interface EventEditorModalProps {
	classId: number;
	eventId: number | null;
	initialStart?: string | null;
	initialEnd?: string | null;
	opened: boolean;
	onClose: () => void;
	onSaved: () => void;
}

const emptyForm: EditorEventDetail = {
	user_id: null,
	class_id: null,
	group_id: null,
	subject_id: null,
	start: '',
	end: '',
	lesson_number: null,
	repeat_until: null,
};

export function EventEditorModal({
	classId,
	eventId,
	initialStart,
	initialEnd,
	opened,
	onClose,
	onSaved,
}: EventEditorModalProps) {
	const queryClient = useQueryClient();
	const isNew = eventId === null;
	const [form, setForm] = useState<EditorEventDetail>(emptyForm);
	const [editType, setEditType] = useState<'one' | 'after' | 'all'>('one');

	const detailQuery = useQuery({
		queryKey: queryKeys.schooltask.editorEvent(classId, eventId ?? 0),
		queryFn: () => schooltaskCalendarApi.editorDetail(classId, eventId ?? 0),
		enabled: opened && !isNew && classId > 0,
	});

	const subgroupsQuery = useQuery({
		queryKey: queryKeys.schooltask.editorSubgroups(classId),
		queryFn: () => schooltaskCalendarApi.editorSubgroups(classId),
		enabled: opened && classId > 0,
	});

	const classQuery = useQuery({
		queryKey: queryKeys.schooltask.class(classId),
		queryFn: () => schooltaskClassApi.get(classId),
		enabled: opened && classId > 0,
	});

	const resolvedSubjectId = useMemo(() => {
		if (form.subject_id) {
			return form.subject_id;
		}
		if (!form.group_id) {
			return 0;
		}
		const subgroup = (classQuery.data?.sub ?? []).find(
			(item) => item.id === form.group_id || item.group_id === form.group_id,
		);
		return subgroup?.subject_id ?? 0;
	}, [classQuery.data?.sub, form.group_id, form.subject_id]);

	const teachersQuery = useQuery({
		queryKey: queryKeys.schooltask.editorTeachers(classId, resolvedSubjectId),
		queryFn: () => schooltaskCalendarApi.editorTeachers(classId, resolvedSubjectId),
		enabled: opened && classId > 0 && resolvedSubjectId > 0,
	});

	useEffect(() => {
		if (isNew) {
			setForm({
				...emptyForm,
				start: initialStart ?? dayjs().hour(8).minute(0).format('YYYY-MM-DD HH:mm:ss'),
				end: initialEnd ?? dayjs().hour(8).minute(45).format('YYYY-MM-DD HH:mm:ss'),
			});
			return;
		}
		if (detailQuery.data) {
			setForm(detailQuery.data);
		}
	}, [detailQuery.data, initialStart, initialEnd, isNew]);

	const subgroupOptions = useMemo(
		() =>
			(subgroupsQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.text ?? String(item.value),
			})),
		[subgroupsQuery.data],
	);

	const teacherOptions = useMemo(
		() =>
			(teachersQuery.data ?? []).map((item) => ({
				value: String(item.value),
				label: item.text ?? String(item.value),
			})),
		[teachersQuery.data],
	);

	const saveMutation = useMutation({
		mutationFn: async () => {
			const payload: EditorEventPayload = {
				id: eventId ?? undefined,
				class_id: classId,
				group_id: form.group_id,
				user_id: form.user_id,
				subject_id: form.subject_id,
				start: form.start,
				end: form.end,
				lesson_number: form.lesson_number,
				repeat_until: form.repeat_until,
				editType,
			};
			if (isNew) {
				return schooltaskCalendarApi.editorAdd(classId, payload);
			}
			return schooltaskCalendarApi.editorEdit(classId, payload);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: ['schooltask', 'calendar', 'editor', classId] });
			onSaved();
			onClose();
		},
		onError: (error) => notifyApiError(error, 'Ошибка сохранения'),
	});

	const deleteMutation = useMutation({
		mutationFn: () =>
			schooltaskCalendarApi.editorRemove(classId, {
				id: eventId ?? undefined,
				editType,
			}),
		onSuccess: () => {
			notifications.show({ message: 'Удалено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: ['schooltask', 'calendar', 'editor', classId] });
			onSaved();
			onClose();
		},
		onError: (error) => notifyApiError(error, 'Ошибка удаления'),
	});

	const selectedSubgroup = form.group_id ? String(form.group_id) : null;

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			title={isNew ? 'Новый урок' : `Урок #${eventId}`}
			size="md"
			centered
		>
			<Stack gap="sm">
				<Select
					label="Подгруппа"
					data={subgroupOptions}
					value={selectedSubgroup}
					onChange={(value) =>
						setForm((current) => ({
							...current,
							group_id: value ? Number(value) : null,
							subject_id: null,
						}))
					}
					searchable
					clearable
				/>
				<Select
					label="Учитель"
					data={teacherOptions}
					value={form.user_id ? String(form.user_id) : null}
					onChange={(value) => setForm((current) => ({ ...current, user_id: value ? Number(value) : null }))}
					searchable
					clearable
					disabled={resolvedSubjectId <= 0}
				/>
				<Select
					label="Номер урока"
					data={Array.from({ length: 8 }, (_, index) => ({
						value: String(index + 1),
						label: `Урок ${index + 1}`,
					}))}
					value={form.lesson_number ? String(form.lesson_number) : null}
					clearable
					onChange={(value) => {
						const lessonNumber = value ? Number(value) : null;
						setForm((current) => {
							if (!lessonNumber) {
								return { ...current, lesson_number: null };
							}
							const date = current.start?.slice(0, 10) ?? dayjs().format('YYYY-MM-DD');
							const times = applyLessonTemplate(date, lessonNumber);
							return {
								...current,
								lesson_number: lessonNumber,
								start: times?.start ?? current.start,
								end: times?.end ?? current.end,
							};
						});
					}}
				/>
				<DateTimeField
					label="Начало"
					value={form.start}
					onChange={(value) => {
						const nextStart = value ?? '';
						setForm((current) => {
							if (!current.lesson_number || !nextStart) {
								return { ...current, start: nextStart };
							}
							const times = applyLessonTemplate(nextStart.slice(0, 10), current.lesson_number);
							return {
								...current,
								start: times?.start ?? nextStart,
								end: times?.end ?? current.end,
							};
						});
					}}
					withSeconds
				/>
				<DateTimeField
					label="Окончание"
					value={form.end}
					onChange={(value) => setForm((current) => ({ ...current, end: value ?? '' }))}
					withSeconds
				/>
				{isNew ? (
					<DateTimeField
						label="Повторять до"
						value={form.repeat_until ?? ''}
						onChange={(value) => setForm((current) => ({ ...current, repeat_until: value }))}
						withSeconds
					/>
				) : null}
				{!isNew ? (
					<Select
						label="Изменить"
						data={[
							{ value: 'one', label: 'Только этот урок' },
							{ value: 'after', label: 'Этот и следующие' },
							{ value: 'all', label: 'Всю серию' },
						]}
						value={editType}
						onChange={(value) => setEditType((value as typeof editType) ?? 'one')}
					/>
				) : null}
				<Group justify="space-between">
					{!isNew ? (
						<Button
							color="red"
							variant="light"
							loading={deleteMutation.isPending}
							onClick={() => {
								confirmAction({
									title: 'Удаление',
									message: 'Удалить урок?',
									confirmLabel: 'Удалить',
									confirmColor: 'red',
									onConfirm: () => deleteMutation.mutate(),
								});
							}}
						>
							Удалить
						</Button>
					) : (
						<span />
					)}
					<Group gap="xs">
						<Button variant="default" onClick={onClose}>
							Отмена
						</Button>
						<Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
							Сохранить
						</Button>
					</Group>
				</Group>
			</Stack>
		</Modal>
	);
}
