import { Button, Group, TextInput } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';

interface QuickAddListProps {
	onAdd: (title: string) => Promise<void>;
}

export function QuickAddList({ onAdd }: QuickAddListProps) {
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
				variant="light"
				leftSection={<IconPlus size={14} />}
				onClick={() => setOpened(true)}
				style={{ alignSelf: 'flex-start', flexShrink: 0 }}
			>
				Добавить список
			</Button>
		);
	}

	return (
		<Group align="flex-end" wrap="nowrap" w={288} style={{ flexShrink: 0 }}>
			<TextInput
				placeholder="Название списка"
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
				style={{ flex: 1 }}
			/>
			<Button size="sm" loading={loading} onClick={() => void handleSubmit()}>
				Добавить
			</Button>
		</Group>
	);
}
