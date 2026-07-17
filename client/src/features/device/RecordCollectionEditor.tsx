import { ActionIcon, Button, Group, Stack, TextInput, Textarea } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';

import { nextTempId } from '@/features/device/deviceAppUtils';

type RecordItem = Record<string, unknown>;

interface RecordCollectionEditorProps {
	title?: string;
	records: Record<string, RecordItem>;
	readOnly: boolean;
	columns: Array<{
		key: string;
		label: string;
		type?: 'text' | 'textarea' | 'checkbox';
	}>;
	onChange: (records: Record<string, RecordItem>) => void;
	createItem?: () => RecordItem;
}

export function RecordCollectionEditor({
	title,
	records,
	readOnly,
	columns,
	onChange,
	createItem,
}: RecordCollectionEditorProps) {
	const entries = Object.entries(records ?? {});

	const updateItem = (key: string, field: string, value: unknown) => {
		onChange({
			...records,
			[key]: {
				...records[key],
				[field]: value,
			},
		});
	};

	const removeItem = (key: string) => {
		const next = { ...records };
		delete next[key];
		onChange(next);
	};

	const addItem = () => {
		const id = nextTempId();
		const item = createItem?.() ?? { id: 0 };
		onChange({ ...records, [id]: item });
	};

	return (
		<Stack gap="sm">
			{title ? (
				<Group justify="space-between">
					<strong>{title}</strong>
					{!readOnly ? (
						<Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addItem}>
							Добавить
						</Button>
					) : null}
				</Group>
			) : null}

			{entries.length === 0 ? (
				<TextInput label="Нет записей" value="" readOnly disabled />
			) : null}

			{entries.map(([key, item]) => (
				<Group key={key} align="flex-start" wrap="nowrap">
					<Stack gap="xs" style={{ flex: 1 }}>
						{columns.map((column) => {
							const value = item[column.key];
							if (column.type === 'textarea') {
								return (
									<Textarea
										key={column.key}
										label={column.label}
										value={String(value ?? '')}
										readOnly={readOnly}
										onChange={(e) => updateItem(key, column.key, e.currentTarget.value)}
										minRows={2}
										autosize
									/>
								);
							}
							return (
								<TextInput
									key={column.key}
									label={column.label}
									value={String(value ?? '')}
									readOnly={readOnly}
									onChange={(e) => updateItem(key, column.key, e.currentTarget.value)}
								/>
							);
						})}
					</Stack>
					{!readOnly ? (
						<ActionIcon color="red" variant="light" mt={24} onClick={() => removeItem(key)}>
							<IconTrash size={16} />
						</ActionIcon>
					) : null}
				</Group>
			))}
		</Stack>
	);
}
