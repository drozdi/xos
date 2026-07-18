import { Button, Group, Text, TextInput } from '@mantine/core';

import type { ExplorerPickerMode } from '../explorerPickerStore';

interface ExplorerPickerBarProps {
	mode: ExplorerPickerMode;
	fileName: string;
	selectedPath: string | null;
	onFileNameChange: (value: string) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ExplorerPickerBar({
	mode,
	fileName,
	selectedPath,
	onFileNameChange,
	onConfirm,
	onCancel,
}: ExplorerPickerBarProps) {
	const confirmLabel = mode === 'save' ? 'Сохранить' : 'Открыть';
	const canConfirm = mode === 'open' ? Boolean(selectedPath) : Boolean(fileName.trim());

	return (
		<Group
			justify="space-between"
			px="sm"
			py={8}
			wrap="nowrap"
			style={{ borderTop: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
		>
			<Group flex={1} gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
				<Text size="sm" c="dimmed" style={{ flexShrink: 0 }}>
					{mode === 'save' ? 'Имя файла' : 'Файл'}
				</Text>
				{mode === 'save' ? (
					<TextInput
						flex={1}
						size="xs"
						value={fileName}
						onChange={(event) => onFileNameChange(event.currentTarget.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && canConfirm) {
								onConfirm();
							}
						}}
						placeholder="note.txt"
					/>
				) : (
					<Text size="sm" truncate title={selectedPath ?? ''} style={{ flex: 1 }}>
						{selectedPath ?? 'Выберите файл'}
					</Text>
				)}
			</Group>
			<Group gap="xs" wrap="nowrap">
				<Button variant="default" size="xs" onClick={onCancel}>
					Отмена
				</Button>
				<Button size="xs" disabled={!canConfirm} onClick={onConfirm}>
					{confirmLabel}
				</Button>
			</Group>
		</Group>
	);
}
