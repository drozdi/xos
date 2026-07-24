import { Button, Flex, Input, Modal, Radio, Table, Typography } from 'antd';
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
	opened?: boolean;
	title?: string;
	enums: Record<string, PropertyEnumItem>;
	readOnly: boolean;
	onClose?: () => void;
	onChange: (enums: Record<string, PropertyEnumItem>, defaultValue: string) => void;
	variant?: 'modal' | 'inline';
}

export function PropertyEnumsEditor({
	opened = true,
	title = 'Значения списка',
	enums,
	readOnly,
	onClose,
	onChange,
	variant = 'modal',
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
		onClose?.();
	};

	const content = (
		<Flex vertical gap={12}>
			{!readOnly ? (
				<Flex justify="flex-end">
					<Button
						size="small"
						icon={<IconPlus size={14} />}
						onClick={() => updateEntries(addEnumItem(enums))}
					>
						Добавить
					</Button>
				</Flex>
			) : null}

			{entries.length === 0 ? (
				<Typography.Text type="secondary">Нет значений</Typography.Text>
			) : (
				<Table
					size="small"
					bordered
					pagination={false}
					rowKey={([key]) => key}
					onRow={(_, index) => ({
						draggable: !readOnly,
						onDragStart: () => setDragIndex(index ?? null),
						onDragOver: (event) => event.preventDefault(),
						onDrop: () => handleDrop(index ?? 0),
						onDragEnd: () => setDragIndex(null),
						style: { opacity: dragIndex === index ? 0.5 : 1 },
					})}
					dataSource={entries}
					columns={[
						{
							title: '',
							key: 'drag',
							width: 36,
							render: () =>
								!readOnly ? (
									<Button
										type="text"
										aria-label="Перетащить"
										icon={<IconGripVertical size={16} />}
										style={{ cursor: 'grab' }}
									/>
								) : null,
						},
						{
							title: 'По умолч.',
							key: 'default',
							width: 56,
							render: (_: unknown, [key, item]: [string, PropertyEnumItem]) => (
								<Radio
									checked={Boolean(item.default)}
									disabled={readOnly}
									onChange={() => updateEntries(setEnumDefault(enums, key, true))}
								/>
							),
						},
						{
							title: 'Значение',
							key: 'value',
							render: (_: unknown, [key, item]: [string, PropertyEnumItem]) => (
								<Input
									value={item.value ?? ''}
									readOnly={readOnly}
									onChange={(e) => updateItem(key, { value: e.target.value })}
								/>
							),
						},
						{
							title: 'Название',
							key: 'name',
							render: (_: unknown, [key, item]: [string, PropertyEnumItem]) => (
								<Input
									value={item.name ?? ''}
									readOnly={readOnly}
									onChange={(e) => updateItem(key, { name: e.target.value })}
								/>
							),
						},
						...(!readOnly
							? [
									{
										title: '',
										key: 'actions',
										width: 48,
										render: (_: unknown, [key]: [string, PropertyEnumItem]) => (
											<Button
												type="text"
												danger
												icon={<IconTrash size={16} />}
												onClick={() => removeItem(key)}
											/>
										),
									},
								]
							: []),
					]}
				/>
			)}

			{variant === 'modal' ? (
				<Flex justify="flex-end">
					<Button onClick={handleSaveClose}>{readOnly ? 'Закрыть' : 'Готово'}</Button>
				</Flex>
			) : null}
		</Flex>
	);

	if (variant === 'inline') {
		return content;
	}

	return (
		<Modal open={opened} onCancel={() => onClose?.()} title={title} width={800} centered footer={null}>
			{content}
		</Modal>
	);
}
