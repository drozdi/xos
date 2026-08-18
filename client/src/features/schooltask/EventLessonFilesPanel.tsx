import {
	ActionIcon,
	Anchor,
	Box,
	Button,
	FileButton,
	Group,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconFolderOpen, IconPaperclip, IconTrash, IconUpload } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { notifyApiError } from '@/core/api/apiError';
import { schooltaskCalendarApi } from '@/core/api/endpoints/schooltaskApi';
import { queryKeys } from '@/core/api/queryKeys';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { useExplorerPickerResult } from '@/features/explorer/useExplorerPickerResult';

const LESSON_FILES_PICKER = 'schooltask:lesson-files';

type LibraryFile = { id: number; name: string; src?: string };

interface EventLessonFilesPanelProps {
	attachedIds: number[];
	attachedMeta?: LibraryFile[];
	onAttachedChange: (ids: number[]) => void;
}

export function EventLessonFilesPanel({
	attachedIds,
	attachedMeta = [],
	onAttachedChange,
}: EventLessonFilesPanelProps) {
	const queryClient = useQueryClient();
	const [librarySearch, setLibrarySearch] = useState('');
	const [ids, setIds] = useState<number[]>(attachedIds);
	const [meta, setMeta] = useState<LibraryFile[]>(attachedMeta);

	const filesQuery = useQuery({
		queryKey: queryKeys.schooltask.teacherFiles,
		queryFn: () => schooltaskCalendarApi.teacherFiles(),
	});

	const commitIds = (updater: (prev: number[]) => number[]) => {
		setIds((prev) => {
			const nextIds = updater(prev);
			onAttachedChange(nextIds);
			return nextIds;
		});
	};

	const mergeMeta = (incoming: LibraryFile[]) => {
		if (incoming.length === 0) {
			return;
		}
		setMeta((prev) => {
			const byId = new Map(prev.map((file) => [file.id, file]));
			for (const file of incoming) {
				byId.set(file.id, file);
			}
			return [...byId.values()];
		});
	};

	const uploadMutation = useMutation({
		mutationFn: (files: File[]) => schooltaskCalendarApi.teacherFilesUpload(files),
		onSuccess: (uploaded) => {
			notifications.show({ message: 'Файлы загружены', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.schooltask.teacherFiles });
			mergeMeta(uploaded);
			commitIds((prev) => [...new Set([...prev, ...uploaded.map((file) => file.id)])]);
		},
		onError: (error) => notifyApiError(error, 'Ошибка загрузки файлов'),
	});

	const importMutation = useMutation({
		mutationFn: (path: string) => schooltaskCalendarApi.teacherFilesImport(path),
		onSuccess: (file) => {
			notifications.show({ message: 'Файл скопирован из проводника', color: 'green' });
			void queryClient.invalidateQueries({ queryKey: queryKeys.schooltask.teacherFiles });
			mergeMeta([file]);
			commitIds((prev) => [...new Set([...prev, file.id])]);
		},
		onError: (error) => notifyApiError(error, 'Не удалось импортировать файл'),
	});

	useExplorerPickerResult(LESSON_FILES_PICKER, (path) => {
		importMutation.mutate(path);
	});

	const libraryFiles = useMemo(() => {
		const items = (filesQuery.data ?? []) as LibraryFile[];
		const query = librarySearch.trim().toLowerCase();
		if (!query) {
			return items;
		}
		return items.filter((file) => file.name.toLowerCase().includes(query));
	}, [filesQuery.data, librarySearch]);

	const attachedSet = useMemo(() => new Set(ids), [ids]);

	const attachedFiles = useMemo(() => {
		const byId = new Map((filesQuery.data ?? []).map((file) => [file.id, file]));
		for (const file of meta) {
			byId.set(file.id, file);
		}
		return ids.map((id) => byId.get(id) ?? { id, name: `Файл #${id}` });
	}, [ids, meta, filesQuery.data]);

	const toggleAttach = (file: LibraryFile) => {
		mergeMeta([file]);
		commitIds((prev) =>
			prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id],
		);
	};

	const openExplorer = () => {
		void openExplorerPicker({
			mode: 'open',
			consumerAppId: LESSON_FILES_PICKER,
			title: 'Выбор файла из проводника',
		});
	};

	return (
		<Stack gap="md" h="100%" p="md">
			<Group justify="space-between" align="flex-end">
				<Text fw={600}>Файлы урока</Text>
				<Group gap="xs">
					<Button
						size="xs"
						variant="light"
						leftSection={<IconFolderOpen size={14} />}
						loading={importMutation.isPending}
						onClick={openExplorer}
					>
						Из проводника
					</Button>
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
			</Group>

			<Box style={{ flex: 1, minHeight: 0 }}>
				<ScrollArea h="100%" offsetScrollbars>
					<Stack gap="md" pr="xs">
						<Box>
							<Text size="sm" fw={500} mb={6}>
								Прикреплено к уроку ({ids.length})
							</Text>
							{ids.length === 0 ? (
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
												onClick={() => toggleAttach(file)}
											>
												<IconTrash size={16} />
											</ActionIcon>
										</Group>
									))}
								</Stack>
							)}
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
									Библиотека пуста
								</Text>
							) : (
								<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
									{libraryFiles.map((file) => {
										const attached = attachedSet.has(file.id);
										return (
											<Group
												key={file.id}
												justify="space-between"
												wrap="nowrap"
												p="xs"
												style={{
													border: '1px solid var(--mantine-color-default-border)',
													borderRadius: 4,
												}}
											>
												<Text size="sm" lineClamp={2} style={{ flex: 1, minWidth: 0 }}>
													{file.name}
												</Text>
												<Button
													size="compact-xs"
													variant={attached ? 'filled' : 'light'}
													onClick={() => toggleAttach(file)}
												>
													{attached ? 'Открепить' : 'Прикрепить'}
												</Button>
											</Group>
										);
									})}
								</SimpleGrid>
							)}
						</Box>
					</Stack>
				</ScrollArea>
			</Box>
		</Stack>
	);
}
