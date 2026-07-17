import { Button, FileInput, Group, Modal, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { schooltaskCalendarApi, type TeacherEventSavePayload } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';

interface EventTeacherModalProps {
	eventId: number | null;
	opened: boolean;
	onClose: () => void;
	onSaved: () => void;
}

export function EventTeacherModal({ eventId, opened, onClose, onSaved }: EventTeacherModalProps) {
	const queryClient = useQueryClient();
	const [theme, setTheme] = useState('');
	const [ht, setHt] = useState('');
	const [pt, setPt] = useState('');
	const [description, setDescription] = useState('');
	const [netResource, setNetResource] = useState('');
	const [keepFileIds, setKeepFileIds] = useState<number[]>([]);
	const [newFiles, setNewFiles] = useState<File[]>([]);

	const detailQuery = useQuery({
		queryKey: queryKeys.schooltask.teacherEvent(eventId ?? 0),
		queryFn: () => schooltaskCalendarApi.teacherEventDetail(eventId ?? 0),
		enabled: opened && eventId !== null,
	});

	useEffect(() => {
		if (!detailQuery.data) {
			return;
		}
		setTheme(detailQuery.data.theme ?? '');
		setHt(detailQuery.data.ht ?? '');
		setPt(detailQuery.data.pt ?? '');
		setDescription(detailQuery.data.description ?? '');
		setNetResource(detailQuery.data.netResource ?? '');
		setKeepFileIds((detailQuery.data.files ?? []).map((file) => file.id));
		setNewFiles([]);
	}, [detailQuery.data]);

	const saveMutation = useMutation({
		mutationFn: async () => {
			if (!eventId) {
				throw new Error('Событие не выбрано');
			}
			const payload: TeacherEventSavePayload = {
				id: eventId,
				theme,
				ht,
				pt,
				description,
				netResource,
				files: keepFileIds,
			};
			await schooltaskCalendarApi.teacherSave(payload, newFiles);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: ['schooltask', 'calendar', 'teacher'] });
			onSaved();
			onClose();
		},
		onError: (error) => notifyApiError(error, 'Ошибка сохранения'),
	});

	const removeExistingFile = (id: number) => {
		setKeepFileIds((current) => current.filter((fileId) => fileId !== id));
	};

	return (
		<Modal opened={opened} onClose={onClose} title="Задание к уроку" size="lg" centered>
			<Stack gap="sm">
				<TextInput label="Тема" value={theme} onChange={(event) => setTheme(event.currentTarget.value)} />
				<Textarea label="Домашнее задание" value={ht} onChange={(event) => setHt(event.currentTarget.value)} minRows={3} />
				<Textarea label="План урока" value={pt} onChange={(event) => setPt(event.currentTarget.value)} minRows={3} />
				<Textarea
					label="Описание"
					value={description}
					onChange={(event) => setDescription(event.currentTarget.value)}
					minRows={2}
				/>
				<Textarea
					label="Интернет-ресурсы"
					description="По одной ссылке в строке"
					value={netResource}
					onChange={(event) => setNetResource(event.currentTarget.value)}
					minRows={2}
				/>
				{(detailQuery.data?.files ?? []).filter((file) => keepFileIds.includes(file.id)).length > 0 ? (
					<Stack gap={4}>
						<Text size="sm" fw={500}>
							Файлы
						</Text>
						{(detailQuery.data?.files ?? [])
							.filter((file) => keepFileIds.includes(file.id))
							.map((file) => (
								<Group key={file.id} justify="space-between">
									<Text size="sm">{file.name}</Text>
									<Button size="xs" variant="light" color="red" onClick={() => removeExistingFile(file.id)}>
										Убрать
									</Button>
								</Group>
							))}
					</Stack>
				) : null}
				<FileInput
					label="Новые файлы"
					multiple
					value={newFiles}
					onChange={(files) => setNewFiles(files ?? [])}
					clearable
				/>
				<Group justify="flex-end" gap="xs">
					<Button variant="default" onClick={onClose}>
						Отмена
					</Button>
					<Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
						Сохранить
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
