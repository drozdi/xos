import { Box, Button, Group, Text, Textarea } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useWindowTitle } from '@/core/hooks/useWindowTitle';

import { saveExplorerText } from '@/features/explorer/explorerApi';
import { openExplorerPicker } from '@/features/explorer/explorerPickerStore';
import { getExplorerFileName } from '@/features/explorer/explorerPathUtils';
import { fetchExplorerText, useExplorerOpenFile } from '@/features/explorer/useExplorerOpenFile';
import { useExplorerPickerResult } from '@/features/explorer/useExplorerPickerResult';

type PickerIntent = 'open' | 'save-as';

export default function ExplorerNotepadApp() {
	const openedPath = useExplorerOpenFile('explorer-notepad');
	const [savedPath, setSavedPath] = useState<string | null>(null);
	const [content, setContent] = useState('');
	const [isDirty, setIsDirty] = useState(false);
	const pickerIntentRef = useRef<PickerIntent | null>(null);

	useWindowTitle(savedPath ? getExplorerFileName(savedPath) : 'Блокнот');

	const loadFile = useCallback(async (path: string) => {
		try {
			const text = await fetchExplorerText(path);
			setSavedPath(path);
			setContent(text);
			setIsDirty(false);
		} catch {
			notifications.show({ message: 'Не удалось открыть файл', color: 'red' });
		}
	}, []);

	const saveToPath = useCallback(async (path: string) => {
		try {
			await saveExplorerText(path, content);
			setSavedPath(path);
			setIsDirty(false);
			notifications.show({ message: 'Файл сохранён', color: 'green' });
		} catch {
			notifications.show({ message: 'Не удалось сохранить файл', color: 'red' });
		}
	}, [content]);

	useEffect(() => {
		if (openedPath) {
			void loadFile(openedPath);
		}
	}, [loadFile, openedPath]);

	useExplorerPickerResult('explorer-notepad', (path) => {
		const intent = pickerIntentRef.current;
		pickerIntentRef.current = null;
		if (intent === 'open') {
			void loadFile(path);
			return;
		}
		if (intent === 'save-as') {
			void saveToPath(path);
		}
	});

	const handleOpen = async () => {
		pickerIntentRef.current = 'open';
		await openExplorerPicker({
			mode: 'open',
			consumerAppId: 'explorer-notepad',
			fileTypes: ['text'],
			initialPath: savedPath ?? undefined,
			title: 'Открыть файл',
		});
	};

	const handleSaveAs = async () => {
		pickerIntentRef.current = 'save-as';
		await openExplorerPicker({
			mode: 'save',
			consumerAppId: 'explorer-notepad',
			fileTypes: ['text'],
			initialPath: savedPath ?? 'home://',
			defaultFileName: savedPath ? getExplorerFileName(savedPath) : 'note.txt',
			title: 'Сохранить файл',
		});
	};

	const handleSave = async () => {
		if (savedPath) {
			await saveToPath(savedPath);
			return;
		}
		await handleSaveAs();
	};

	return (
		<Box
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				padding: 'var(--mantine-spacing-md)',
				gap: 'var(--mantine-spacing-sm)',
			}}
		>
			<Group justify="space-between" wrap="nowrap" style={{ flexShrink: 0 }}>
				<Text size="sm" c="dimmed" truncate title={savedPath ?? 'Новый файл'}>
					{savedPath ?? 'Новый файл'}
					{isDirty ? ' *' : ''}
				</Text>
				<Group gap="xs" wrap="nowrap">
					<Button variant="default" size="xs" onClick={() => void handleOpen()}>
						Открыть…
					</Button>
					<Button variant="default" size="xs" onClick={() => void handleSave()} disabled={Boolean(savedPath) && !isDirty}>
						Сохранить
					</Button>
					<Button variant="default" size="xs" onClick={() => void handleSaveAs()}>
						Сохранить как…
					</Button>
				</Group>
			</Group>
			<Textarea
				value={content}
				onChange={(event) => {
					setContent(event.currentTarget.value);
					setIsDirty(true);
				}}
				styles={{
					root: { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' },
					wrapper: { flex: 1, minHeight: 0 },
					input: { height: '100%', minHeight: 0, resize: 'none' },
				}}
			/>
		</Box>
	);
}
