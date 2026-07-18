import { Button, Group, Stack, Textarea, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';

import { saveExplorerText } from '@/features/explorer/explorerApi';
import { fetchExplorerText, useExplorerOpenFile } from '@/features/explorer/useExplorerOpenFile';

export default function ExplorerNotepadApp() {
	const openedPath = useExplorerOpenFile('explorer-notepad');
	const [path, setPath] = useState('home://note.txt');
	const [content, setContent] = useState('');

	useEffect(() => {
		if (openedPath) {
			setPath(openedPath);
		}
	}, [openedPath]);

	useEffect(() => {
		if (!openedPath) {
			return;
		}
		void fetchExplorerText(openedPath)
			.then(setContent)
			.catch(() => setContent(''));
	}, [openedPath]);

	const handleSave = async () => {
		try {
			await saveExplorerText(path, content);
			notifications.show({ message: 'Файл сохранён', color: 'green' });
		} catch {
			notifications.show({ message: 'Не удалось сохранить файл', color: 'red' });
		}
	};

	return (
		<Stack h="100%" p="md" gap="sm">
			<TextInput label="Путь" value={path} onChange={(e) => setPath(e.currentTarget.value)} />
			<Textarea
				value={content}
				onChange={(e) => setContent(e.currentTarget.value)}
				minRows={16}
				style={{ flex: 1 }}
			/>
			<Group justify="flex-end">
				<Button onClick={handleSave}>Сохранить</Button>
			</Group>
		</Stack>
	);
}
