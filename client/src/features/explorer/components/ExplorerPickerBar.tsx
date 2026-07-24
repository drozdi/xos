import { Button, Flex, Input, Typography } from 'antd';

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
		<Flex
			justify="space-between"
			wrap="nowrap"
			align="center"
			gap="small"
			style={{
				padding: '8px 12px',
				borderTop: '1px solid var(--xos-shell-border)',
				flexShrink: 0,
			}}
		>
			<Flex gap="small" wrap="nowrap" align="center" style={{ minWidth: 0, flex: 1 }}>
				<Typography.Text type="secondary" style={{ fontSize: 13, flexShrink: 0 }}>
					{mode === 'save' ? 'Имя файла' : 'Файл'}
				</Typography.Text>
				{mode === 'save' ? (
					<Input
						size="small"
						value={fileName}
						onChange={(event) => onFileNameChange(event.target.value)}
						onKeyDown={(event) => {
							if (event.key === 'Enter' && canConfirm) {
								onConfirm();
							}
						}}
						placeholder="note.txt"
						style={{ flex: 1 }}
					/>
				) : (
					<Typography.Text ellipsis title={selectedPath ?? ''} style={{ flex: 1, fontSize: 13 }}>
						{selectedPath ?? 'Выберите файл'}
					</Typography.Text>
				)}
			</Flex>
			<Flex gap="small" wrap="nowrap">
				<Button size="small" onClick={onCancel}>
					Отмена
				</Button>
				<Button type="primary" size="small" disabled={!canConfirm} onClick={onConfirm}>
					{confirmLabel}
				</Button>
			</Flex>
		</Flex>
	);
}
