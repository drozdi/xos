import { Button, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { pkbApi } from '@/core/api/endpoints/pkbApi';
import { queryKeys } from '@/core/api/queryKeys';
import { collectMarkdownPaths } from '@/features/pkb/dailyNotes';

interface NewFromTemplateModalProps {
	vaultId: number;
	templatesFolder: string;
	opened: boolean;
	onClose: () => void;
	onCreated: (path: string) => void;
}

export function NewFromTemplateModal({
	vaultId,
	templatesFolder,
	opened,
	onClose,
	onCreated,
}: NewFromTemplateModalProps) {
	const queryClient = useQueryClient();
	const [templatePath, setTemplatePath] = useState<string | null>(null);
	const [newPath, setNewPath] = useState('');

	const treeQuery = useQuery({
		queryKey: queryKeys.pkb.fileTree(vaultId, templatesFolder),
		queryFn: () => pkbApi.fileTree(vaultId, templatesFolder, 5),
		enabled: opened,
	});

	const templateOptions = useMemo(() => {
		const root = treeQuery.data;
		if (!root) {
			return [];
		}
		const nodes = root.children ?? (root.type === 'folder' ? [] : [root]);
		return collectMarkdownPaths(nodes).map((path) => ({
			value: path,
			label: path.split('/').pop() ?? path,
		}));
	}, [treeQuery.data]);

	const createMutation = useMutation({
		mutationFn: async () => {
			if (!templatePath || !newPath.trim()) {
				throw new Error('Выберите шаблон и укажите путь');
			}
			const targetPath = newPath.trim().endsWith('.md')
				? newPath.trim()
				: `${newPath.trim()}.md`;
			const { content } = await pkbApi.fileContent(vaultId, templatePath);
			const slash = targetPath.lastIndexOf('/');
			if (slash > 0) {
				const folder = targetPath.slice(0, slash);
				await pkbApi.createFolder(vaultId, folder).catch(() => undefined);
			}
			await pkbApi.putFileContent(vaultId, targetPath, content);
			return targetPath;
		},
		onSuccess: async (path) => {
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.fileTree(vaultId) });
			await queryClient.invalidateQueries({ queryKey: queryKeys.pkb.notes(vaultId) });
			notifications.show({ color: 'green', message: 'Заметка создана из шаблона' });
			onCreated(path);
			onClose();
			setTemplatePath(null);
			setNewPath('');
		},
		onError: () => {
			notifications.show({ color: 'red', message: 'Не удалось создать заметку' });
		},
	});

	return (
		<Modal opened={opened} onClose={onClose} title="Новая заметка из шаблона" size="md">
			<Stack gap="md">
				{treeQuery.isLoading ? (
					<Text size="sm" c="dimmed">
						Загрузка шаблонов…
					</Text>
				) : templateOptions.length === 0 ? (
					<Text size="sm" c="dimmed">
						В папке {templatesFolder} нет .md файлов
					</Text>
				) : (
					<Select
						label="Шаблон"
						placeholder="Выберите шаблон"
						data={templateOptions}
						value={templatePath}
						onChange={setTemplatePath}
						searchable
					/>
				)}
				<TextInput
					label="Путь новой заметки"
					placeholder="Notes/my-note.md"
					value={newPath}
					onChange={(event) => setNewPath(event.currentTarget.value)}
				/>
				<Button
					onClick={() => createMutation.mutate()}
					loading={createMutation.isPending}
					disabled={!templatePath || !newPath.trim()}
				>
					Создать
				</Button>
			</Stack>
		</Modal>
	);
}
