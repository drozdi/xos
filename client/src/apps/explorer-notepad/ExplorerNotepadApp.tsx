import { Button, Flex, Input, Typography } from 'antd';
import { notifications } from '@/ui/toast';
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
		<div
			style={{
				position: 'absolute',
				inset: 0,
				display: 'flex',
				flexDirection: 'column',
				minHeight: 0,
				overflow: 'hidden',
				padding: 16,
				gap: 12,
			}}
		>
			<Flex justify="space-between" wrap="nowrap" style={{ flexShrink: 0 }} gap="small">
				<Typography.Text type="secondary" ellipsis title={savedPath ?? 'Новый файл'} style={{ fontSize: 13 }}>
					{savedPath ?? 'Новый файл'}
					{isDirty ? ' *' : ''}
				</Typography.Text>
				<Flex gap="small" wrap="nowrap">
					<Button size="small" onClick={() => void handleOpen()}>
						Открыть…
					</Button>
					<Button size="small" onClick={() => void handleSave()} disabled={Boolean(savedPath) && !isDirty}>
						Сохранить
					</Button>
					<Button size="small" onClick={() => void handleSaveAs()}>
						Сохранить как…
					</Button>
				</Flex>
			</Flex>
			<Input.TextArea
				value={content}
				onChange={(event) => {
					setContent(event.target.value);
					setIsDirty(true);
				}}
				style={{ flex: 1, minHeight: 0, resize: 'none' }}
			/>
		</div>
	);
}
