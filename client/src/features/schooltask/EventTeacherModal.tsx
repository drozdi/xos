import {
	ActionIcon,
	Box,
	Button,
	Group,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { Link, RichTextEditor } from '@mantine/tiptap';
import { IconFiles, IconX } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Underline from '@tiptap/extension-underline';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { schooltaskCalendarApi, type TeacherEventSavePayload } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { useCoreApi } from '@/core/hooks/useCoreApi';

import { EventLessonFilesPanel } from './EventLessonFilesPanel';

interface EventTeacherModalProps {
	eventId: number | null;
	opened: boolean;
	onClose: () => void;
	onSaved: () => void;
}

type LibraryFile = { id: number; name: string; src?: string };

export function EventTeacherModal({ eventId, opened, onClose, onSaved }: EventTeacherModalProps) {
	const coreApi = useCoreApi();
	const queryClient = useQueryClient();
	const filesWindowRef = useRef<{ close: () => void } | null>(null);
	const [theme, setTheme] = useState('');
	const [ht, setHt] = useState('');
	const [pt, setPt] = useState('');
	const [description, setDescription] = useState('');
	const [netResource, setNetResource] = useState('');
	const [attachedIds, setAttachedIds] = useState<number[]>([]);
	const [attachedMeta, setAttachedMeta] = useState<LibraryFile[]>([]);

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
		const files = detailQuery.data.files ?? [];
		setAttachedIds(files.map((file) => file.id));
		setAttachedMeta(files);
		if (editor && !editor.isDestroyed) {
			editor.commands.setContent(nextDescription || '');
		}
	}, [detailQuery.data, editor]);

	useEffect(() => {
		return () => {
			filesWindowRef.current?.close();
			filesWindowRef.current = null;
		};
	}, []);

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

	const openFilesWindow = () => {
		if (filesWindowRef.current) {
			return;
		}
		const handle = coreApi.window.createChildWindow({
			title: 'Файлы урока',
			width: 640,
			height: 520,
			content: (
				<EventLessonFilesPanel
					attachedIds={attachedIds}
					attachedMeta={attachedMeta}
					onAttachedChange={setAttachedIds}
				/>
			),
		});
		filesWindowRef.current = handle;
	};

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

						<Group justify="space-between" align="center">
							<Text size="sm" c="dimmed">
								Прикреплено файлов: {attachedIds.length}
							</Text>
							<Button
								variant="light"
								leftSection={<IconFiles size={16} />}
								onClick={openFilesWindow}
							>
								Файлы урока
							</Button>
						</Group>
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
