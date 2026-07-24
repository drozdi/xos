import { Button, Checkbox, Flex, Modal, Typography } from 'antd';

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
		<Modal
			open={Boolean(conflict)}
			onCancel={onClose}
			title="Конфликт имён"
			centered
			footer={null}
		>
			{conflict ? (
				<Flex vertical gap="middle">
					<Typography.Text style={{ fontSize: 13 }}>{conflict.message}</Typography.Text>
					<Typography.Text type="secondary" style={{ fontSize: 12 }}>
						{conflict.source} → {conflict.target}
					</Typography.Text>
					<Checkbox
						checked={applyToAll}
						onChange={(event) => onApplyToAllChange(event.target.checked)}
					>
						Применить ко всем
					</Checkbox>
					<Flex justify="flex-end" gap="small">
						<Button onClick={() => onResolve('skip')}>Пропустить</Button>
						<Button type="dashed" onClick={() => onResolve('rename')}>
							Переименовать
						</Button>
						<Button type="primary" onClick={() => onResolve('replace')}>
							Заменить
						</Button>
					</Flex>
				</Flex>
			) : null}
		</Modal>
	);
}
