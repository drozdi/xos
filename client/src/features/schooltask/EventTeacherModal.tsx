import {
	Button,
	Checkbox,
	Flex,
	Input,
	Modal,
	Typography,
	Upload,
} from 'antd';
import { notifications } from '@/ui/toast';
import { CloseOutlined, DeleteOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
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
	const [linkModalOpen, setLinkModalOpen] = useState(false);
	const [linkUrl, setLinkUrl] = useState('https://');

	const editor = useEditor({
		extensions: [
			StarterKit,
			Underline,
			Link.configure({ openOnClick: false }),
		],
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
		<div
			style={{
				position: 'absolute',
				inset: 0,
				zIndex: 200,
				display: 'flex',
				flexDirection: 'column',
				backgroundColor: 'var(--ant-color-bg-container, #fff)',
			}}
		>
			<Flex
				justify="space-between"
				align="center"
				style={{
					flexShrink: 0,
					padding: '12px 16px',
					borderBottom: '1px solid rgba(0,0,0,0.06)',
				}}
			>
				<Typography.Text strong>Задание к уроку</Typography.Text>
				<Button type="text" aria-label="Закрыть" icon={<CloseOutlined style={{ fontSize: 18 }} />} onClick={onClose} />
			</Flex>

			<Flex vertical gap={16} style={{ flex: 1, minHeight: 0, padding: 16 }}>
				<div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
					<Flex vertical gap={16} style={{ paddingRight: 8 }}>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
								gap: 16,
							}}
						>
							<div>
								<div style={{ marginBottom: 4 }}>Тема</div>
								<Input.TextArea
									value={theme}
									onChange={(event) => setTheme(event.target.value)}
									autoSize={{ minRows: 3 }}
								/>
							</div>
							<div>
								<div style={{ marginBottom: 4 }}>План урока</div>
								<Input.TextArea
									value={pt}
									onChange={(event) => setPt(event.target.value)}
									autoSize={{ minRows: 3 }}
								/>
							</div>
							<div>
								<div style={{ marginBottom: 4 }}>Интернет-ресурсы</div>
								<Input.TextArea
									value={netResource}
									onChange={(event) => setNetResource(event.target.value)}
									autoSize={{ minRows: 3 }}
								/>
							</div>
							<div>
								<div style={{ marginBottom: 4 }}>Домашнее задание</div>
								<Input.TextArea
									value={ht}
									onChange={(event) => setHt(event.target.value)}
									autoSize={{ minRows: 3 }}
								/>
							</div>
						</div>

						<div>
							<div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13 }}>Описание</div>
							<div
								style={{
									border: '1px solid rgba(0,0,0,0.15)',
									borderRadius: 6,
									overflow: 'hidden',
								}}
							>
								<Flex
									wrap="wrap"
									gap={4}
									style={{
										padding: 6,
										borderBottom: '1px solid rgba(0,0,0,0.06)',
										background: 'rgba(0,0,0,0.02)',
									}}
								>
									<Button
										size="small"
										type={editor?.isActive('bold') ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleBold().run()}
									>
										B
									</Button>
									<Button
										size="small"
										type={editor?.isActive('italic') ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleItalic().run()}
									>
										I
									</Button>
									<Button
										size="small"
										type={editor?.isActive('underline') ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleUnderline().run()}
									>
										U
									</Button>
									<Button
										size="small"
										type={editor?.isActive('strike') ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleStrike().run()}
									>
										S
									</Button>
									<Button
										size="small"
										type={editor?.isActive('heading', { level: 2 }) ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
									>
										H2
									</Button>
									<Button
										size="small"
										type={editor?.isActive('heading', { level: 3 }) ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
									>
										H3
									</Button>
									<Button
										size="small"
										type={editor?.isActive('bulletList') ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleBulletList().run()}
									>
										• List
									</Button>
									<Button
										size="small"
										type={editor?.isActive('orderedList') ? 'primary' : 'default'}
										onClick={() => editor?.chain().focus().toggleOrderedList().run()}
									>
										1. List
									</Button>
									<Button
										size="small"
										type={editor?.isActive('link') ? 'primary' : 'default'}
										onClick={() => {
											if (!editor) {
												return;
											}
											if (editor.isActive('link')) {
												editor.chain().focus().unsetLink().run();
												return;
											}
											const previous = editor.getAttributes('link').href as string | undefined;
											setLinkUrl(previous ?? 'https://');
											setLinkModalOpen(true);
										}}
									>
										Link
									</Button>
									<Button size="small" onClick={() => editor?.chain().focus().undo().run()}>
										Undo
									</Button>
									<Button size="small" onClick={() => editor?.chain().focus().redo().run()}>
										Redo
									</Button>
								</Flex>
								<div className="schooltask-teacher-editor" style={{ minHeight: 180, padding: 8 }}>
									<style>{`
										.schooltask-teacher-editor .ProseMirror {
											min-height: 160px;
											outline: none;
										}
										.schooltask-teacher-editor .ProseMirror p {
											margin: 0 0 0.5em;
										}
									`}</style>
									<EditorContent editor={editor} />
								</div>
							</div>
							<Modal
								title="Ссылка"
								open={linkModalOpen}
								onCancel={() => setLinkModalOpen(false)}
								onOk={() => {
									if (!editor) {
										setLinkModalOpen(false);
										return;
									}
									const url = linkUrl.trim();
									if (!url) {
										editor.chain().focus().extendMarkRange('link').unsetLink().run();
									} else {
										editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
									}
									setLinkModalOpen(false);
								}}
								okText="Применить"
								cancelText="Отмена"
								destroyOnHidden
							>
								<Input
									value={linkUrl}
									onChange={(event) => setLinkUrl(event.target.value)}
									placeholder="https://"
									onPressEnter={() => {
										if (!editor) {
											return;
										}
										const url = linkUrl.trim();
										if (!url) {
											editor.chain().focus().extendMarkRange('link').unsetLink().run();
										} else {
											editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
										}
										setLinkModalOpen(false);
									}}
								/>
							</Modal>
						</div>

						<Flex vertical gap={12}>
							<Flex justify="space-between" align="flex-end">
								<Typography.Text strong>Файлы</Typography.Text>
								<Upload
									multiple
									showUploadList={false}
									beforeUpload={(file, fileList) => {
										if (file === fileList[0]) {
											uploadMutation.mutate(fileList as unknown as File[]);
										}
										return false;
									}}
								>
									<Button
										size="small"
										icon={<UploadOutlined style={{ fontSize: 14 }} />}
										loading={uploadMutation.isPending}
									>
										Загрузить
									</Button>
								</Upload>
							</Flex>

							<div>
								<div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13 }}>
									Прикреплено к уроку
								</div>
								{attachedFiles.length === 0 ? (
									<Typography.Text type="secondary" style={{ fontSize: 13 }}>
										Нет прикреплённых файлов
									</Typography.Text>
								) : (
									<Flex vertical gap={6}>
										{attachedFiles.map((file) => (
											<Flex key={file.id} justify="space-between" align="center" wrap="nowrap">
												<Flex gap={8} align="center" wrap="nowrap" style={{ minWidth: 0 }}>
													<PaperClipOutlined style={{ fontSize: 16 }} />
													{file.src ? (
														<Typography.Link
															href={file.src}
															target="_blank"
															style={{
																fontSize: 13,
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
															}}
														>
															{file.name}
														</Typography.Link>
													) : (
														<Typography.Text
															style={{
																fontSize: 13,
																overflow: 'hidden',
																textOverflow: 'ellipsis',
																whiteSpace: 'nowrap',
															}}
														>
															{file.name}
														</Typography.Text>
													)}
												</Flex>
												<Button
													type="text"
													danger
													aria-label="Открепить"
													icon={<DeleteOutlined style={{ fontSize: 16 }} />}
													onClick={() => detachFile(file.id)}
												/>
											</Flex>
										))}
									</Flex>
								)}
								<Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
									Открепление не удаляет файл — его можно снова выбрать из библиотеки
								</Typography.Text>
							</div>

							<div>
								<Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
									<div style={{ fontWeight: 500, fontSize: 13 }}>Моя библиотека</div>
									<Input
										placeholder="Поиск…"
										size="small"
										value={librarySearch}
										onChange={(event) => setLibrarySearch(event.target.value)}
										style={{ width: 220 }}
									/>
								</Flex>
								{filesQuery.isLoading ? (
									<Typography.Text type="secondary" style={{ fontSize: 13 }}>
										Загрузка…
									</Typography.Text>
								) : libraryFiles.length === 0 ? (
									<Typography.Text type="secondary" style={{ fontSize: 13 }}>
										Библиотека пуста — загрузите файлы
									</Typography.Text>
								) : (
									<Flex
										vertical
										gap={4}
										style={{ maxHeight: 220, overflow: 'auto' }}
									>
										{libraryFiles.map((file) => (
											<Checkbox
												key={file.id}
												checked={attachedSet.has(file.id)}
												onChange={(event) =>
													toggleAttach(file.id, event.target.checked)
												}
											>
												{file.name}
											</Checkbox>
										))}
									</Flex>
								)}
							</div>
						</Flex>
					</Flex>
				</div>

				<Flex justify="flex-end" gap={8}>
					<Button onClick={onClose}>Отмена</Button>
					<Button type="primary" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
						Сохранить
					</Button>
				</Flex>
			</Flex>
		</div>
	);
}
