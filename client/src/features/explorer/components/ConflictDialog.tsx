import { Button, Group, Modal, Stack, Text } from '@mantine/core';

export type ConflictPolicy = 'replace' | 'skip' | 'rename';

export interface ConflictState {
	source: string;
	target: string;
	message: string;
}

interface ConflictDialogProps {
	conflict: ConflictState | null;
	applyToAll: boolean;
	onApplyToAllChange: (value: boolean) => void;
	onResolve: (policy: ConflictPolicy) => void;
	onClose: () => void;
}

export function ConflictDialog({
	conflict,
	applyToAll,
	onApplyToAllChange,
	onResolve,
	onClose,
}: ConflictDialogProps) {
	return (
		<Modal opened={Boolean(conflict)} onClose={onClose} title="Конфликт имён" centered>
			{conflict && (
				<Stack gap="md">
					<Text size="sm">{conflict.message}</Text>
					<Text size="xs" c="dimmed">
						{conflict.source} → {conflict.target}
					</Text>
					<label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
						<input
							type="checkbox"
							checked={applyToAll}
							onChange={(event) => onApplyToAllChange(event.currentTarget.checked)}
						/>
						<Text size="sm">Применить ко всем</Text>
					</label>
					<Group justify="flex-end">
						<Button variant="default" onClick={() => onResolve('skip')}>
							Пропустить
						</Button>
						<Button variant="light" onClick={() => onResolve('rename')}>
							Переименовать
						</Button>
						<Button onClick={() => onResolve('replace')}>
							Заменить
						</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
}
