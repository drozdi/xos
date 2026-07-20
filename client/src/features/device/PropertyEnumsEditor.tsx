import {
	ActionIcon,
	Button,
	Group,
	Modal,
	Radio,
	Stack,
	Table,
	Text,
	TextInput,
} from '@mantine/core';
import { IconGripVertical, IconPlus, IconTrash } from '@tabler/icons-react';
import { useMemo, useState } from 'react';

import {
	addEnumItem,
	createEnumItem,
	normalizeEnumRecord,
	reorderEnumEntries,
	resolveDefaultEnumValue,
	setEnumDefault,
	sortEnumEntries,
} from '@/features/device/propertyEnumUtils';
import type { PropertyEnumItem } from '@/features/device/propertyTypes';

interface PropertyEnumsEditorProps {
	opened: boolean;
	title?: string;
	enums: Record<string, PropertyEnumItem>;
	readOnly: boolean;
	onClose: () => void;
	onChange: (enums: Record<string, PropertyEnumItem>, defaultValue: string) => void;
}

export function PropertyEnumsEditor({
	opened,
	title = 'Значения списка',
	enums,
	readOnly,
	onClose,
	onChange,
}: PropertyEnumsEditorProps) {
	const [dragIndex, setDragIndex] = useState<number | null>(null);
	const entries = useMemo(() => sortEnumEntries(normalizeEnumRecord(enums)), [enums]);

	const updateEntries = (next: Record<string, PropertyEnumItem>) => {
		onChange(next, resolveDefaultEnumValue(next));
	};

	const updateItem = (key: string, patch: Partial<PropertyEnumItem>) => {
		const current = enums[key] ?? createEnumItem(0);
		updateEntries({
			...enums,
			[key]: {
				...current,
				...patch,
			},
		});
	};

	const removeItem = (key: string) => {
		const next = { ...enums };
		delete next[key];
		updateEntries(next);
	};

	const handleDrop = (toIndex: number) => {
		if (dragIndex == null || readOnly) {
			return;
		}
		updateEntries(reorderEnumEntries(entries, dragIndex, toIndex));
		setDragIndex(null);
	};

	const handleSaveClose = () => {
		onClose();
	};

	return (
		<Modal opened={opened} onClose={onClose} title={title} size="lg" centered>
			<Stack gap="sm">
				{!readOnly ? (
					<Group justify="flex-end">
						<Button
							size="xs"
							variant="light"
							leftSection={<IconPlus size={14} />}
							onClick={() => updateEntries(addEnumItem(enums))}
						>
							Добавить
						</Button>
					</Group>
				) : null}

				{entries.length === 0 ? (
					<Text size="sm" c="dimmed">
						Нет значений
					</Text>
				) : (
					<Table highlightOnHover withTableBorder withColumnBorders>
						<Table.Thead>
							<Table.Tr>
								<Table.Th w={36} aria-label="Сортировка" />
								<Table.Th w={56}>По умолч.</Table.Th>
								<Table.Th>Значение</Table.Th>
								<Table.Th>Название</Table.Th>
								{!readOnly ? <Table.Th w={48} aria-label="Действия" /> : null}
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{entries.map(([key, item], index) => (
								<Table.Tr
									key={key}
									draggable={!readOnly}
									onDragStart={() => setDragIndex(index)}
									onDragOver={(event) => event.preventDefault()}
									onDrop={() => handleDrop(index)}
									onDragEnd={() => setDragIndex(null)}
									style={{ opacity: dragIndex === index ? 0.5 : 1 }}
								>
									<Table.Td>
										{!readOnly ? (
											<ActionIcon variant="subtle" aria-label="Перетащить" style={{ cursor: 'grab' }}>
												<IconGripVertical size={16} />
											</ActionIcon>
										) : null}
									</Table.Td>
									<Table.Td>
										<Radio
											checked={Boolean(item.default)}
											disabled={readOnly}
											onChange={() => updateEntries(setEnumDefault(enums, key, true))}
										/>
									</Table.Td>
									<Table.Td>
										<TextInput
											value={item.value ?? ''}
											readOnly={readOnly}
											onChange={(e) => updateItem(key, { value: e.currentTarget.value })}
										/>
									</Table.Td>
									<Table.Td>
										<TextInput
											value={item.name ?? ''}
											readOnly={readOnly}
											onChange={(e) => updateItem(key, { name: e.currentTarget.value })}
										/>
									</Table.Td>
									{!readOnly ? (
										<Table.Td>
											<ActionIcon color="red" variant="light" onClick={() => removeItem(key)}>
												<IconTrash size={16} />
											</ActionIcon>
										</Table.Td>
									) : null}
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				)}

				<Group justify="flex-end">
					<Button variant="default" onClick={handleSaveClose}>
						{readOnly ? 'Закрыть' : 'Готово'}
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
}
