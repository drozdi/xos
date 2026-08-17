import { Button, Group, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

interface QuickAddCardProps {
	onAdd: (title: string) => Promise<void>;
}

export function QuickAddCard({ onAdd }: QuickAddCardProps) {
	const [opened, setOpened] = useState(false);
	const [title, setTitle] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		const trimmed = title.trim();
		if (!trimmed) {
			return;
		}
		setLoading(true);
		try {
			await onAdd(trimmed);
			setTitle('');
			setOpened(false);
		} finally {
			setLoading(false);
		}
	};

	if (!opened) {
		return (
			<Button
				variant="subtle"
				size="xs"
				fullWidth
				leftSection={<IconPlus size={14} />}
				onClick={() => setOpened(true)}
			>
				Карточка
			</Button>
		);
	}

	return (
		<StackLike gap="xs">
			<TextInput
				size="xs"
				placeholder="Название карточки"
				value={title}
				onChange={(event) => setTitle(event.currentTarget.value)}
				onKeyDown={(event) => {
					if (event.key === 'Enter') {
						void handleSubmit();
					}
					if (event.key === 'Escape') {
						setOpened(false);
						setTitle('');
					}
				}}
				autoFocus
			/>
			<Group gap="xs">
				<Button size="xs" loading={loading} onClick={() => void handleSubmit()}>
					Добавить
				</Button>
				<Button
					size="xs"
					variant="subtle"
					onClick={() => {
						setOpened(false);
						setTitle('');
					}}
				>
					Отмена
				</Button>
			</Group>
		</StackLike>
	);
}

function StackLike({ children, gap }: { children: React.ReactNode; gap: string }) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: `var(--mantine-spacing-${gap})` }}>
			{children}
		</div>
	);
}
