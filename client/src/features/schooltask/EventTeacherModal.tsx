import {
	ActionIcon,
	Anchor,
	Box,
	Button,
	Checkbox,
	FileButton,
	Group,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { IconPaperclip, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useMemo, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { schooltaskCalendarApi, type TeacherEventSavePayload } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';

interface EventTeacherModalProps {
	eventId: number | null;
	opened: boolean;
	onClose: () => void;
	onSaved: () => void;
}

type LibraryFile = { id: number; name: string; src?: string };

export function EventTeacherModal({ eventId, opened, onClose, onSaved }: EventTeacherModalProps) {
	const queryClient = useQueryClient();
	const [theme, setTheme] = useState('');
	const [ht, setHt] = useState('');
	const [pt, setPt] = useState('');
	const [description, setDescription] = useState('');
	const [netResource, setNetResource] = useState('');
	const [attachedIds, setAttachedIds] = useState<number[]>([]);
	const [librarySearch, setLibrarySearch] = useState('');

	const editor = useEditor({
		extensions: [StarterKit, Underline, Link],
		content: '',
		onUpdate: ({ editor: current }) => {
			setDescription(current.getHTML());
		},
	});

	const detailQuery = useQuery({
		queryKey: queryKeys.schooltask.teacherEvent(eventId ?? 0),
		queryFn: () => schooltaskCalendarApi.teacherEventDetail(eventId ?? 0),
		enabled: opened && eventId !== null,
	});

	const filesQuery = useQuery({
		queryKey: queryKeys.schooltask.teacherFiles,
		queryFn: () => schooltaskCalendarApi.teacherFiles(),
		enabled: opened,
	});

	useEffect(() => {
		if (!detailQuery.data) {
			return;
		}
		setTheme(detailQuery.data.theme ?? '');
		setHt(detailQuery.data.ht ?? '');
		setPt(detailQuery.data.pt ?? '');
		const nextDescription = detailQuery.data.description ?? '';
		setDescription(nextDescription);
		setNetResource(detailQuery.data.netResource ?? '');
		setAttachedIds((detailQuery.data.files ?? []).map((file) => file.id));
		if (editor && !editor.isDestroyed) {
			editor.commands.setContent(nextDescription || '');
		}
	}, [detailQuery.data, editor]);

	const uploadMutation = useMutation({
		mutationFn: (files: File[]) => schooltaskCalendarApi.teacherFilesUpload(files),
		onSuccess: (uploaded) => {
			notifications.show({ message: 'Файлы загружены', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.schooltask.teacherFiles });
			setAttachedIds((current) => {
				const next = new Set(current);
				for (const file of uploaded) {
					next.add(file.id);
				}
				return [...next];
			});
		},
		onError: (error) => notifyApiError(error, 'Ошибка загрузки файлов'),
	});

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
				description: editor?.getHTML() ?? description,
				netResource,
				files: attachedIds,
			};
			await schooltaskCalendarApi.teacherSave(payload);
		},
		onSuccess: () => {
			notifications.show({ message: 'Сохранено', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: ['schooltask', 'calendar', 'teacher'] });
			onSaved();
			onClose();
		},
		onError: (error) => notifyApiError(error, 'Ошибка сохранения'),
	});

	const libraryFiles = useMemo(() => {
		const items = (filesQuery.data ?? []) as LibraryFile[];
		const query = librarySearch.trim().toLowerCase();
		if (!query) {
			return items;
		}
		return items.filter((file) => file.name.toLowerCase().includes(query));
	}, [filesQuery.data, librarySearch]);

	const attachedSet = useMemo(() => new Set(attachedIds), [attachedIds]);

	const toggleAttach = (fileId: number, checked: boolean) => {
		setAttachedIds((current) => {
			if (checked) {
				return current.includes(fileId) ? current : [...current, fileId];
			}
			return current.filter((id) => id !== fileId);
		});
	};

	const detachFile = (fileId: number) => {
		setAttachedIds((current) => current.filter((id) => id !== fileId));
	};

	const attachedFiles = useMemo(() => {
		const byId = new Map((filesQuery.data ?? []).map((file) => [file.id, file]));
		for (const file of detailQuery.data?.files ?? []) {
			if (!byId.has(file.id)) {
				byId.set(file.id, file);
			}
		}
		return attachedIds
			.map((id) => byId.get(id))
			.filter((file): file is LibraryFile => Boolean(file));
	}, [attachedIds, detailQuery.data?.files, filesQuery.data]);

	if (!opened) {
		return null;
	}

	return (
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				zIndex: 200,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: 'var(--mantine-color-body)',
			}}
		>
			<Group
				justify="space-between"
				px="md"
				py="sm"
				style={{
					flexShrink: 0,
					borderBottom: '1px solid var(--mantine-color-default-border)',
				}}
			>
				<Text fw={600}>Задание к уроку</Text>
				<ActionIcon variant="subtle" aria-label="Закрыть" onClick={onClose}>
					<IconX size={18} />
				</ActionIcon>
			</Group>

			<Stack gap="md" p="md" style={{ flex: 1, minHeight: 0 }}>
				<ScrollArea style={{ flex: 1 }} offsetScrollbars>
					<Stack gap="md" pr="xs">
						<SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
							<Textarea
								label="Тема"
								value={theme}
								onChange={(event) => setTheme(event.currentTarget.value)}
								minRows={3}
								autosize
							/>
							<Textarea
								label="План урока"
								value={pt}
								onChange={(event) => setPt(event.currentTarget.value)}
								minRows={3}
								autosize
							/>
							<Textarea
								label="Интернет-ресурсы"
								value={netResource}
								onChange={(event) => setNetResource(event.currentTarget.value)}
								minRows={3}
								autosize
							/>
							<Textarea
								label="Домашнее задание"
								value={ht}
								onChange={(event) => setHt(event.currentTarget.value)}
								minRows={3}
								autosize
							/>
						</SimpleGrid>

						<Box>
							<Text size="sm" fw={500} mb={6}>
								Описание
							</Text>
							<RichTextEditor editor={editor}>
								<RichTextEditor.Toolbar sticky stickyOffset={0}>
									<RichTextEditor.ControlsGroup>
										<RichTextEditor.Bold />
										<RichTextEditor.Italic />
										<RichTextEditor.Underline />
										<RichTextEditor.Strikethrough />
										<RichTextEditor.ClearFormatting />
									</RichTextEditor.ControlsGroup>
									<RichTextEditor.ControlsGroup>
										<RichTextEditor.H2 />
										<RichTextEditor.H3 />
										<RichTextEditor.BulletList />
										<RichTextEditor.OrderedList />
									</RichTextEditor.ControlsGroup>
									<RichTextEditor.ControlsGroup>
										<RichTextEditor.Link />
										<RichTextEditor.Unlink />
									</RichTextEditor.ControlsGroup>
									<RichTextEditor.ControlsGroup>
										<RichTextEditor.Undo />
										<RichTextEditor.Redo />
									</RichTextEditor.ControlsGroup>
								</RichTextEditor.Toolbar>
								<RichTextEditor.Content mih={180} />
							</RichTextEditor>
						</Box>

						<Stack gap="sm">
							<Group justify="space-between" align="flex-end">
								<Text fw={600}>Файлы</Text>
								<FileButton
									multiple
									onChange={(files) => {
										if (files && files.length > 0) {
											uploadMutation.mutate(files);
										}
									}}
								>
									{(props) => (
										<Button
											{...props}
											size="xs"
											variant="light"
											leftSection={<IconUpload size={14} />}
											loading={uploadMutation.isPending}
										>
											Загрузить
										</Button>
									)}
								</FileButton>
							</Group>

							<Box>
								<Text size="sm" fw={500} mb={6}>
									Прикреплено к уроку
								</Text>
								{attachedFiles.length === 0 ? (
									<Text size="sm" c="dimmed">
										Нет прикреплённых файлов
									</Text>
								) : (
									<Stack gap={6}>
										{attachedFiles.map((file) => (
											<Group key={file.id} justify="space-between" wrap="nowrap">
												<Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
													<IconPaperclip size={16} />
													{file.src ? (
														<Anchor href={file.src} target="_blank" size="sm" lineClamp={1}>
															{file.name}
														</Anchor>
													) : (
														<Text size="sm" lineClamp={1}>
															{file.name}
														</Text>
													)}
												</Group>
												<ActionIcon
													color="red"
													variant="light"
													aria-label="Открепить"
													onClick={() => detachFile(file.id)}
												>
													<IconTrash size={16} />
												</ActionIcon>
											</Group>
										))}
									</Stack>
								)}
								<Text size="xs" c="dimmed" mt={4}>
									Открепление не удаляет файл — его можно снова выбрать из библиотеки
								</Text>
							</Box>

							<Box>
								<Group justify="space-between" mb={6}>
									<Text size="sm" fw={500}>
										Моя библиотека
									</Text>
									<TextInput
										placeholder="Поиск…"
										size="xs"
										value={librarySearch}
										onChange={(event) => setLibrarySearch(event.currentTarget.value)}
										w={220}
									/>
								</Group>
								{filesQuery.isLoading ? (
									<Text size="sm" c="dimmed">
										Загрузка…
									</Text>
								) : libraryFiles.length === 0 ? (
									<Text size="sm" c="dimmed">
										Библиотека пуста — загрузите файлы
									</Text>
								) : (
									<Stack gap={4} mah={220} style={{ overflow: 'auto' }}>
										{libraryFiles.map((file) => (
											<Checkbox
												key={file.id}
												label={file.name}
												checked={attachedSet.has(file.id)}
												onChange={(event) =>
													toggleAttach(file.id, event.currentTarget.checked)
												}
											/>
										))}
									</Stack>
								)}
							</Box>
						</Stack>
					</Stack>
				</ScrollArea>

				<Group justify="flex-end" gap="xs">
					<Button variant="default" onClick={onClose}>
						Отмена
					</Button>
					<Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
						Сохранить
					</Button>
				</Group>
			</Stack>
		</Box>
	);
}
